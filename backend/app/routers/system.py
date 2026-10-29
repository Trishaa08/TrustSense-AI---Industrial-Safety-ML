from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime, timezone
from app.config import (
    ENVIRONMENT, DATASET_PROVENANCE, SAFETY_DISCLAIMER, DATA_DIR, MODELS_DIR
)
from app.data_loader import data_loader
from app.models.model_registry import model_registry
from app.services.alert_service import alert_service
from app.services.trust_score import trust_engine
from app.db.database import get_all_overrides, reset_all_overrides

router = APIRouter(tags=["System"])

SYSTEM_SETTINGS = {
    "selected_facility": "Synthetic Chemical Facility Alpha (Zones A-D)",
    "playback_speed": 1.0,
    "anomaly_sensitivity": 0.65,
    "ewma_alpha": 0.20,
    "cusum_threshold": 5.0,
    "min_reliable_sensors": 3,
    "trust_threshold": 60.0,
    "map_layer": "satellite_osm",
    "theme": "light_professional"
}

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": ENVIRONMENT,
        "version": "1.0.0-research",
        "data_dir_exists": DATA_DIR.exists(),
        "models_ready": (MODELS_DIR / "random_forest.joblib").exists(),
        "safety_disclaimer": SAFETY_DISCLAIMER
    }

@router.get("/system/status")
def get_system_status():
    """Returns dynamic overview KPI metrics derived from active network state and SQLite overrides."""
    pos_df = data_loader.get_sensor_positions()
    total_sensors = len(pos_df)
    overrides = get_all_overrides()
    
    # Active alerts
    alerts = alert_service.get_alerts()
    active_count = len([a for a in alerts if a["status"] in ["new", "investigating"]])

    # Baseline sensor readings
    baseline_readings = {
        "S01": 12.4, "S02": 13.1, "S03": 34.2, "S04": 16.5,
        "S05": 14.2, "S06": 37.1, "S07": 12.8, "S08": 11.9,
        "S09": 13.5, "S10": 19.4, "S11": 12.2, "S12": 11.8,
        "S13": 85.0, "S14": 14.6, "S15": 12.5, "S16": 12.1
    }
    baseline_trust = {
        "S01": 96.0, "S02": 92.0, "S03": 43.0, "S04": 78.0,
        "S05": 88.0, "S06": 54.0, "S07": 91.0, "S08": 94.0,
        "S09": 89.0, "S10": 68.0, "S11": 93.0, "S12": 95.0,
        "S13": 35.0, "S14": 72.0, "S15": 90.0, "S16": 94.0
    }

    healthy_count = 0
    faulty_count = 0
    trust_scores = []
    readings = {}

    for sid in pos_df["sensor_id"]:
        r_val = baseline_readings.get(sid, 12.0)
        t_val = baseline_trust.get(sid, 90.0)

        if sid in overrides:
            ov = overrides[sid]
            if ov["gas_reading"] is not None:
                r_val = float(ov["gas_reading"])
            if ov["injected_fault"] and ov["injected_fault"] != "none":
                t_val = min(t_val, 45.0)

        readings[sid] = r_val
        trust_scores.append(t_val)
        if t_val >= 80.0:
            healthy_count += 1
        else:
            faulty_count += 1

    highest_sensor = max(readings, key=readings.get)
    highest_gas = readings[highest_sensor]
    avg_trust = sum(trust_scores) / max(1, len(trust_scores))
    has_gas_event = highest_gas >= 25.0

    return {
        "overall_status": "warning" if (active_count > 0 or has_gas_event) else "operational",
        "gas_event_status": "suspected_event" if has_gas_event else "no_event",
        "total_sensors": total_sensors,
        "healthy_sensors": healthy_count,
        "suspected_faulty_sensors": faulty_count,
        "unavailable_sensors": 0,
        "average_trust_score": round(avg_trust, 1),
        "highest_gas_reading": round(highest_gas, 2),
        "highest_gas_sensor_id": highest_sensor,
        "active_alerts_count": active_count,
        "simulation_mode": True,
        "has_user_modifications": len(overrides) > 0,
        "modified_sensors_count": len(overrides),
        "data_provenance": DATASET_PROVENANCE,
        "last_update": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "selected_site": SYSTEM_SETTINGS["selected_facility"],
        "safety_disclaimer": SAFETY_DISCLAIMER
    }

@router.get("/system/settings")
def get_settings():
    return {
        "settings": SYSTEM_SETTINGS,
        "trust_weights": trust_engine.weights
    }

@router.post("/system/settings")
def update_settings(payload: Dict[str, Any]):
    if "settings" in payload:
        SYSTEM_SETTINGS.update(payload["settings"])
    if "trust_weights" in payload:
        trust_engine.update_weights(payload["trust_weights"])
    return {
        "message": "Settings updated successfully.",
        "settings": SYSTEM_SETTINGS,
        "trust_weights": trust_engine.weights
    }

@router.post("/system/settings/reset")
def reset_settings():
    reset_all_overrides()
    alert_service.reset_demo_alerts()
    SYSTEM_SETTINGS.update({
        "selected_facility": "Synthetic Chemical Facility Alpha (Zones A-D)",
        "playback_speed": 1.0,
        "anomaly_sensitivity": 0.65,
        "ewma_alpha": 0.20,
        "cusum_threshold": 5.0,
        "min_reliable_sensors": 3,
        "trust_threshold": 60.0,
        "map_layer": "satellite_osm",
        "theme": "light_professional"
    })
    return {"message": "Settings and sensor states reset to defaults.", "settings": SYSTEM_SETTINGS}
