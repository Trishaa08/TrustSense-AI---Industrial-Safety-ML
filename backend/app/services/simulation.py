import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from app.data_loader import data_loader
from app.services.localization import localization_engine
import logging

logger = logging.getLogger("trustsense.simulation")

class SimulationPlaybackService:
    """
    Historical Simulation Playback Engine.
    Streams 1-minute observations from sensor_timeseries_demo.csv (23,040 rows, 48 hours).
    Synchronizes sensor readings, fault states, and spatial leak localization across time.
    """
    def __init__(self):
        self.ts_df: Optional[pd.DataFrame] = None
        self.timestamps: List[str] = []
        self._load_timeseries()

    def _load_timeseries(self):
        try:
            df = data_loader.get_timeseries_demo()
            # Sort by timestamp
            df = df.sort_values(["timestamp", "sensor_id"]).reset_index(drop=True)
            self.ts_df = df
            self.timestamps = sorted(df["timestamp"].unique().tolist())
            logger.info(f"Simulation engine loaded {len(self.timestamps)} unique timesteps across {df['sensor_id'].nunique()} units.")
        except Exception as e:
            logger.error(f"Failed to initialize simulation engine: {e}")

    def get_simulation_info(self) -> Dict[str, Any]:
        return {
            "total_steps": len(self.timestamps),
            "start_time": self.timestamps[0] if self.timestamps else None,
            "time_start": self.timestamps[0] if self.timestamps else None,
            "end_time": self.timestamps[-1] if self.timestamps else None,
            "time_end": self.timestamps[-1] if self.timestamps else None,
            "frequency": "1 minute",
            "duration_hours": round(len(self.timestamps) / 60, 1),
            "active_units_count": self.ts_df["sensor_id"].nunique() if self.ts_df is not None else 0,
            "sensors_tracked": sorted(self.ts_df["sensor_id"].unique().tolist()) if self.ts_df is not None else [],
            "current_step": 0,
            "is_synthetic": True,
            "disclaimer": "Simulation — CSV playback, not a live sensor connection."
        }

    def get_step(self, step_index: int) -> Dict[str, Any]:
        """Returns the synchronized network state for a specific timestep index [0 .. N-1]."""
        if not self.timestamps or self.ts_df is None:
            return {"error": "Timeseries dataset not loaded"}

        idx = max(0, min(step_index, len(self.timestamps) - 1))
        target_ts = self.timestamps[idx]

        step_rows = self.ts_df[self.ts_df["timestamp"] == target_ts]
        
        sensors_data = []
        has_gas_event = False
        has_fault = False
        fault_type_observed = "none"

        localization_readings = []

        # Map to positions
        pos_df = data_loader.get_sensor_positions()
        pos_map = {r["sensor_id"]: r for _, r in pos_df.iterrows()}

        for _, r in step_rows.iterrows():
            sid = r["sensor_id"]
            gas_ppm = float(r.get("gas_reading_simulated_ppm", 12.0))
            is_event = int(r.get("gas_event", 0)) == 1
            is_fault = int(r.get("fault_active", 0)) == 1
            f_type = str(r.get("fault_type", "none"))

            if is_event:
                has_gas_event = True
            if is_fault:
                has_fault = True
                fault_type_observed = f_type

            # Compute trust based on fault state
            if is_fault:
                trust = 40.0 if f_type != "drift" else 62.0
                health = "suspected_faulty"
            elif is_event:
                trust = 95.0
                health = "healthy"
            else:
                trust = 96.0
                health = "healthy"

            p_info = pos_map.get(sid, {})
            s_entry = {
                "sensor_id": sid,
                "sensor_type": p_info.get("sensor_type", "MQ-Generic"),
                "x_m": float(p_info.get("x_m", 10.0)),
                "y_m": float(p_info.get("y_m", 10.0)),
                "zone": p_info.get("zone", "Zone-A"),
                "gas_reading": round(gas_ppm, 2),
                "true_gas_ppm_simulated": round(float(r.get("true_gas_ppm_simulated", gas_ppm)), 2),
                "temperature_c": float(r.get("temperature_c", 22.0)),
                "humidity_pct": float(r.get("humidity_pct", 50.0)),
                "health_status": health,
                "trust_score": trust,
                "suspected_fault": f_type if is_fault else "none",
                "gas_event": is_event
            }
            sensors_data.append(s_entry)
            localization_readings.append({
                "sensor_id": sid,
                "gas_reading": gas_ppm,
                "trust_score": trust
            })

        # Run spatial localization for this step if gas readings indicate activity
        max_gas = max([s["gas_reading"] for s in sensors_data]) if sensors_data else 0.0
        localized = None
        if max_gas > 15.0 or has_gas_event:
            localized = localization_engine.estimate_location(localization_readings, method="fault_aware")

        sensor_readings_map = {s["sensor_id"]: s["gas_reading"] for s in sensors_data}
        sensor_trust_map = {s["sensor_id"]: s["trust_score"] for s in sensors_data}
        fault_injections_map = {s["sensor_id"]: s["suspected_fault"] for s in sensors_data}

        return {
            "step_index": idx,
            "timestamp": target_ts,
            "total_steps": len(self.timestamps),
            "sensors": sensors_data,
            "sensor_readings": sensor_readings_map,
            "sensor_trust_scores": sensor_trust_map,
            "fault_injections": fault_injections_map,
            "has_gas_event": has_gas_event,
            "active_gas_event": has_gas_event,
            "has_fault": has_fault,
            "fault_type_observed": fault_type_observed,
            "max_gas_reading": round(max_gas, 2),
            "localized_leak": localized,
            "localization": localized,
            "banner": "Simulation — CSV playback, not a live sensor connection."
        }

simulation_service = SimulationPlaybackService()
