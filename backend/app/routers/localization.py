from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from app.schemas import LocalizationRequest, LocalizationResult
from app.services.localization import localization_engine
from app.data_loader import data_loader

router = APIRouter(prefix="/localization", tags=["Localization"])

@router.post("/estimate")
def estimate_leak_location(request: LocalizationRequest):
    """
    Estimates candidate leak location using requested method:
    - 'baseline': Ordinary concentration-weighted centroid of all sensors
    - 'fault_aware': Reliability-weighted spatial centroid
    - 'filtered': Strictly excludes sensors with trust < threshold
    """
    if request.readings:
        readings_dict = [r.model_dump() for r in request.readings]
    elif request.leak_id:
        # Load from synthetic ground truth sample
        samples_df = data_loader.get_leak_localization_samples()
        sub = samples_df[samples_df["leak_id"] == request.leak_id]
        if len(sub) == 0:
            raise HTTPException(status_code=404, detail=f"Leak sample '{request.leak_id}' not found.")
        readings_dict = []
        for _, r in sub.iterrows():
            sid = r["sensor_id"]
            # S06 simulated offset for rich demonstration
            trust = 54.0 if sid == "S06" else 95.0
            readings_dict.append({
                "sensor_id": sid,
                "gas_reading": float(r["gas_reading_ppm_simulated"]),
                "trust_score": trust
            })
    else:
        # Use active network state including any user modifications
        from app.db.database import get_all_overrides
        overrides = get_all_overrides()
        pos_df = data_loader.get_sensor_positions()
        
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

        readings_dict = []
        for sid in pos_df["sensor_id"]:
            r_val = baseline_readings.get(sid, 12.0)
            t_val = baseline_trust.get(sid, 90.0)
            if sid in overrides:
                ov = overrides[sid]
                if ov["gas_reading"] is not None:
                    r_val = float(ov["gas_reading"])
                if ov["injected_fault"] and ov["injected_fault"] != "none":
                    t_val = min(t_val, 45.0)
            readings_dict.append({
                "sensor_id": sid,
                "gas_reading": r_val,
                "trust_score": t_val
            })

    res = localization_engine.estimate_location(
        readings=readings_dict,
        method=request.method,
        min_reliable_sensors=request.min_reliable_sensors,
        trust_threshold=request.trust_threshold
    )
    return res

@router.get("/experiments")
def get_localization_benchmark_experiments():
    """
    Returns research evaluation benchmark comparing:
    - Nominal baseline vs fault-aware
    - Fault-injection stress test (sensor S05 stuck high)
    - Hard filtering vs soft trust weighting
    """
    return localization_engine.run_benchmark_experiments()

@router.get("/ground-truth")
def get_ground_truth_events():
    """Returns all 30 ground truth synthetic leak events."""
    df = data_loader.get_leak_ground_truth()
    return {"ground_truth_events": df.to_dict(orient="records")}
