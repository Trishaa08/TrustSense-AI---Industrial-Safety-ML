import sqlite3
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging
from app.config import BACKEND_DIR

logger = logging.getLogger("trustsense.db")
DB_PATH = BACKEND_DIR / "trustsense.db"

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite schema for sensor overrides, simulation events, alerts, and settings."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Sensor overrides (active modifications without altering source CSVs)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sensor_overrides (
                sensor_id TEXT PRIMARY KEY,
                x_m REAL,
                y_m REAL,
                gas_reading REAL,
                temperature_c REAL,
                humidity_pct REAL,
                airflow_m_s REAL,
                injected_fault TEXT DEFAULT 'none',
                fault_params_json TEXT DEFAULT '{}',
                is_modified INTEGER DEFAULT 0,
                modified_at TEXT
            )
        """)

        # 2. Simulation event log (audit trail of user actions & fault injections)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS simulation_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                sensor_id TEXT,
                action TEXT,
                details_json TEXT
            )
        """)

        # 3. Persisted alerts & acknowledgements
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS persisted_alerts (
                id TEXT PRIMARY KEY,
                timestamp TEXT,
                severity TEXT,
                alert_type TEXT,
                sensor_id TEXT,
                zone TEXT,
                reading REAL,
                trust_score REAL,
                title TEXT,
                description TEXT,
                status TEXT DEFAULT 'new',
                analyst_signature TEXT DEFAULT '',
                analyst_notes TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT
            )
        """)

        # 4. Settings persistence
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS persisted_settings (
                key TEXT PRIMARY KEY,
                value_json TEXT,
                updated_at TEXT
            )
        """)

        conn.commit()
        logger.info(f"SQLite database initialized at {DB_PATH}")
    finally:
        conn.close()

# Sensor Override Queries
def get_all_overrides() -> Dict[str, Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sensor_overrides WHERE is_modified = 1")
        rows = cursor.fetchall()
        result = {}
        for r in rows:
            result[r["sensor_id"]] = {
                "sensor_id": r["sensor_id"],
                "x_m": r["x_m"],
                "y_m": r["y_m"],
                "gas_reading": r["gas_reading"],
                "temperature_c": r["temperature_c"],
                "humidity_pct": r["humidity_pct"],
                "airflow_m_s": r["airflow_m_s"],
                "injected_fault": r["injected_fault"],
                "fault_params": json.loads(r["fault_params_json"] or "{}"),
                "is_modified": bool(r["is_modified"]),
                "modified_at": r["modified_at"]
            }
        return result
    finally:
        conn.close()

def get_sensor_override(sensor_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sensor_overrides WHERE sensor_id = ?", (sensor_id,))
        r = cursor.fetchone()
        if not r or not r["is_modified"]:
            return None
        return {
            "sensor_id": r["sensor_id"],
            "x_m": r["x_m"],
            "y_m": r["y_m"],
            "gas_reading": r["gas_reading"],
            "temperature_c": r["temperature_c"],
            "humidity_pct": r["humidity_pct"],
            "airflow_m_s": r["airflow_m_s"],
            "injected_fault": r["injected_fault"],
            "fault_params": json.loads(r["fault_params_json"] or "{}"),
            "is_modified": bool(r["is_modified"]),
            "modified_at": r["modified_at"]
        }
    finally:
        conn.close()

def save_sensor_override(
    sensor_id: str,
    gas_reading: Optional[float] = None,
    temperature_c: Optional[float] = None,
    humidity_pct: Optional[float] = None,
    airflow_m_s: Optional[float] = None,
    x_m: Optional[float] = None,
    y_m: Optional[float] = None,
    injected_fault: str = "none",
    fault_params: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    now_str = datetime.now(timezone.utc).isoformat()
    fault_json = json.dumps(fault_params or {})

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sensor_overrides (
                sensor_id, x_m, y_m, gas_reading, temperature_c, humidity_pct, airflow_m_s,
                injected_fault, fault_params_json, is_modified, modified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(sensor_id) DO UPDATE SET
                x_m = coalesce(excluded.x_m, sensor_overrides.x_m),
                y_m = coalesce(excluded.y_m, sensor_overrides.y_m),
                gas_reading = coalesce(excluded.gas_reading, sensor_overrides.gas_reading),
                temperature_c = coalesce(excluded.temperature_c, sensor_overrides.temperature_c),
                humidity_pct = coalesce(excluded.humidity_pct, sensor_overrides.humidity_pct),
                airflow_m_s = coalesce(excluded.airflow_m_s, sensor_overrides.airflow_m_s),
                injected_fault = excluded.injected_fault,
                fault_params_json = excluded.fault_params_json,
                is_modified = 1,
                modified_at = excluded.modified_at
        """, (sensor_id, x_m, y_m, gas_reading, temperature_c, humidity_pct, airflow_m_s, injected_fault, fault_json, now_str))

        # Log to simulation audit trail
        cursor.execute("""
            INSERT INTO simulation_events (timestamp, sensor_id, action, details_json)
            VALUES (?, ?, ?, ?)
        """, (now_str, sensor_id, "modify_sensor", json.dumps({
            "gas_reading": gas_reading,
            "injected_fault": injected_fault,
            "x_m": x_m,
            "y_m": y_m
        })))

        conn.commit()
        return get_sensor_override(sensor_id) or {}
    finally:
        conn.close()

def reset_all_overrides():
    """Restores all sensor readings and coordinates to original demo dataset values."""
    now_str = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sensor_overrides")
        cursor.execute("""
            INSERT INTO simulation_events (timestamp, sensor_id, action, details_json)
            VALUES (?, ?, ?, ?)
        """, (now_str, "ALL", "reset_to_demo", json.dumps({"message": "All sensor overrides restored to immutable CSV values"})))
        conn.commit()
    finally:
        conn.close()

# Alerts Persistence Queries
def get_persisted_alerts(
    severity: Optional[str] = None,
    sensor_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM persisted_alerts WHERE 1=1"
        params = []
        if severity and severity != "all":
            query += " AND severity = ?"
            params.append(severity)
        if sensor_id and sensor_id != "all":
            query += " AND sensor_id = ?"
            params.append(sensor_id)
        if status and status != "all":
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY timestamp DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        alerts = []
        for r in rows:
            alerts.append({
                "id": r["id"],
                "alert_id": r["id"],
                "timestamp": r["timestamp"],
                "severity": r["severity"],
                "alert_type": r["alert_type"],
                "sensor_id": r["sensor_id"],
                "zone": r["zone"],
                "reading": r["reading"],
                "trust_score": r["trust_score"],
                "title": r["title"],
                "description": r["description"],
                "status": r["status"],
                "analyst_signature": r["analyst_signature"],
                "analyst_notes": r["analyst_notes"],
                "updated_at": r["updated_at"]
            })
        return alerts
    finally:
        conn.close()

def upsert_alert(alert_data: Dict[str, Any]):
    now_str = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO persisted_alerts (
                id, timestamp, severity, alert_type, sensor_id, zone, reading, trust_score,
                title, description, status, analyst_signature, analyst_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                analyst_signature = coalesce(nullif(excluded.analyst_signature, ''), persisted_alerts.analyst_signature),
                analyst_notes = coalesce(nullif(excluded.analyst_notes, ''), persisted_alerts.analyst_notes),
                updated_at = excluded.updated_at
        """, (
            alert_data["id"],
            alert_data.get("timestamp", now_str),
            alert_data.get("severity", "warning"),
            alert_data.get("alert_type", "anomaly"),
            alert_data.get("sensor_id", "S01"),
            alert_data.get("zone", "Zone-A"),
            alert_data.get("reading", 12.0),
            alert_data.get("trust_score", 90.0),
            alert_data.get("title", "Alert"),
            alert_data.get("description", ""),
            alert_data.get("status", "new"),
            alert_data.get("analyst_signature", ""),
            alert_data.get("analyst_notes", ""),
            now_str,
            now_str
        ))
        conn.commit()
    finally:
        conn.close()

def update_alert_status(alert_id: str, new_status: str, analyst: str, notes: str) -> Optional[Dict[str, Any]]:
    now_str = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE persisted_alerts
            SET status = ?, analyst_signature = ?, analyst_notes = ?, updated_at = ?
            WHERE id = ?
        """, (new_status, analyst, notes, now_str, alert_id))
        conn.commit()
        
        cursor.execute("SELECT * FROM persisted_alerts WHERE id = ?", (alert_id,))
        r = cursor.fetchone()
        if not r:
            return None
        res = dict(r)
        res["alert_id"] = res["id"]
        return res
    finally:
        conn.close()

def reset_alerts_to_default(default_alerts: List[Dict[str, Any]]):
    """Seed or re-seed initial demo alerts into persisted table."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM persisted_alerts")
        for a in default_alerts:
            cursor.execute("""
                INSERT INTO persisted_alerts (
                    id, timestamp, severity, alert_type, sensor_id, zone, reading, trust_score,
                    title, description, status, analyst_signature, analyst_notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                a["id"], a["timestamp"], a["severity"], a["alert_type"], a["sensor_id"],
                a["zone"], a["reading"], a["trust_score"], a["title"], a["description"],
                a.get("status", "new"), a.get("analyst_signature", ""), a.get("analyst_notes", ""),
                a["timestamp"], a["timestamp"]
            ))
        conn.commit()
    finally:
        conn.close()

# Auto-initialize database schema on import
init_db()
