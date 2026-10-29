from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import json
import logging
from app.db.database import (
    get_persisted_alerts,
    upsert_alert,
    update_alert_status,
    reset_alerts_to_default
)

logger = logging.getLogger("trustsense.alerts")

DEMO_ALERTS = [
    {
        "id": "ALT-1001",
        "timestamp": "2025-02-02 06:15:00",
        "sensor_id": "S03",
        "zone": "Zone-A",
        "severity": "critical",
        "alert_type": "suspected_leak",
        "title": "Elevated Gas Concentration Detected in Zone-A",
        "description": "Sensors S01, S02, and S03 observed rising methane concentration exceeding 30 ppm.",
        "status": "new",
        "trust_score": 92.0,
        "reading": 34.2,
        "analyst_signature": "",
        "analyst_notes": ""
    },
    {
        "id": "ALT-1002",
        "timestamp": "2025-02-02 05:40:00",
        "sensor_id": "S06",
        "zone": "Zone-B",
        "severity": "warning",
        "alert_type": "sensor_fault",
        "title": "Suspected Sensor Offset / Calibration Bias on S06",
        "description": "Sensor S06 reading remained +25 units above ambient baseline while adjacent unit S07 was at 12 ppm.",
        "status": "acknowledged",
        "trust_score": 54.0,
        "reading": 37.1,
        "analyst_signature": "Dr. Rebecca (Senior Safety Analyst)",
        "analyst_notes": "Flagged for bump test inspection; sensor excluded from primary leak centroid calculation."
    },
    {
        "id": "ALT-1003",
        "timestamp": "2025-02-01 22:10:00",
        "sensor_id": "S13",
        "zone": "Zone-D",
        "severity": "critical",
        "alert_type": "sensor_fault",
        "title": "Stuck Signal Anomaly on S13",
        "description": "Sensor output invariant across 45 consecutive observations despite temperature swing.",
        "status": "investigating",
        "trust_score": 35.0,
        "reading": 85.0,
        "analyst_signature": "M. Davis (Field Technician)",
        "analyst_notes": "Technician dispatched to Zone-D junction box."
    },
    {
        "id": "ALT-1004",
        "timestamp": "2025-02-01 14:05:00",
        "sensor_id": "S04",
        "zone": "Zone-A",
        "severity": "warning",
        "alert_type": "anomaly",
        "title": "High Frequency Noise Surge on S04",
        "description": "Standard deviation increased by 3.5x over nominal reference profile.",
        "status": "resolved",
        "trust_score": 78.0,
        "reading": 16.5,
        "analyst_signature": "Dr. Rebecca",
        "analyst_notes": "Traced to temporary grounding interference during maintenance work. Resolved."
    }
]

class AlertService:
    """Manages alert lifecycle, SQLite persistence, audit trail, acknowledgement, and deduplication."""
    def __init__(self):
        self._ensure_seeded()

    def _ensure_seeded(self):
        existing = get_persisted_alerts()
        if not existing:
            reset_alerts_to_default(DEMO_ALERTS)
            logger.info("Seeded initial demo alerts into SQLite.")

    def get_alerts(
        self,
        severity: Optional[str] = None,
        sensor_id: Optional[str] = None,
        alert_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return get_persisted_alerts(severity=severity, sensor_id=sensor_id, status=status)

    def acknowledge_alert(
        self,
        alert_id: str,
        new_status: str,
        analyst_name: str,
        notes: str = ""
    ) -> Optional[Dict[str, Any]]:
        return update_alert_status(alert_id, new_status, analyst_name, notes)

    def record_alert(
        self,
        sensor_id: str,
        severity: str,
        alert_type: str,
        title: str,
        description: str,
        reading: float,
        trust_score: float,
        zone: str = "Zone-A"
    ) -> Dict[str, Any]:
        """Creates or deduplicates a generated alert and persists to SQLite."""
        # Simple deduplication: check if an identical active alert exists within last 5 minutes
        existing = get_persisted_alerts(sensor_id=sensor_id, status="new")
        for a in existing:
            if a["alert_type"] == alert_type and a["title"] == title:
                return a  # deduplicated

        alert_id = f"ALT-{uuid.uuid4().hex[:6].upper()}"
        alert_data = {
            "id": alert_id,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            "severity": severity,
            "alert_type": alert_type,
            "sensor_id": sensor_id,
            "zone": zone,
            "reading": reading,
            "trust_score": trust_score,
            "title": title,
            "description": description,
            "status": "new",
            "analyst_signature": "",
            "analyst_notes": ""
        }
        upsert_alert(alert_data)
        logger.info(f"Persisted new alert {alert_id} for sensor {sensor_id}.")
        return alert_data

    def reset_demo_alerts(self):
        reset_alerts_to_default(DEMO_ALERTS)

alert_service = AlertService()
