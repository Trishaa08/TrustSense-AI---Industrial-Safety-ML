import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from app.data_loader import data_loader
from app.services.trust_score import trust_engine
import logging

logger = logging.getLogger("trustsense.diagnostics")

class DiagnosticService:
    """Provides deep diagnostic inspection and reference fingerprint curve comparisons."""
    def __init__(self):
        self.ref_profiles_df: Optional[pd.DataFrame] = None
        self._load_profiles()

    def _load_profiles(self):
        try:
            self.ref_profiles_df = data_loader.get_reference_profiles()
        except Exception as e:
            logger.warning(f"Could not load reference profiles in diagnostic service: {e}")

    def generate_fingerprint_curve(self, sensor_id: str, fault_type: str = "none") -> Dict[str, Any]:
        """
        Synthesizes realistic 0-100s pulse response/recovery curve matching
        healthy reference statistics vs current sensor behavior.
        Matches the 'Response/Recovery Fingerprint (RFE)' from UI Screenshot 1.
        """
        t = np.linspace(0, 100, 101)
        
        # Get sensor reference values
        resp_time = 18.0
        recov_time = 32.0
        peak_amp = 150.0

        if self.ref_profiles_df is not None:
            sub = self.ref_profiles_df[self.ref_profiles_df["sensor_id"] == sensor_id]
            for _, r in sub.iterrows():
                fname = r["feature_name"]
                if fname == "response_time_s":
                    resp_time = float(r["healthy_reference_mean"])
                elif fname == "recovery_time_s":
                    recov_time = float(r["healthy_reference_mean"])

        # Nominal healthy curve: sigmoid rise, flat plateau (40-60s), exponential recovery
        healthy_curve = np.zeros_like(t)
        for i, ti in enumerate(t):
            if ti < 20:
                healthy_curve[i] = 10.0 + (peak_amp - 10.0) / (1.0 + np.exp(-(ti - 10) / (resp_time / 4.0)))
            elif ti <= 60:
                healthy_curve[i] = peak_amp
            else:
                healthy_curve[i] = 10.0 + (peak_amp - 10.0) * np.exp(-(ti - 60) / (recov_time / 2.5))

        # Current observed curve altered according to detected fault
        current_curve = healthy_curve.copy()
        
        if fault_type == "slow_response":
            # Sluggish rise, delayed plateau, trailing recovery
            for i, ti in enumerate(t):
                if ti < 35:
                    current_curve[i] = 10.0 + (peak_amp - 10.0) / (1.0 + np.exp(-(ti - 18) / (resp_time / 2.0)))
                elif ti <= 60:
                    current_curve[i] = peak_amp * 0.95
                else:
                    current_curve[i] = 10.0 + (peak_amp - 10.0) * np.exp(-(ti - 60) / (recov_time * 1.8 / 2.5))
        elif fault_type == "drift":
            # Upward baseline slope
            current_curve += np.linspace(0, 35, len(t))
        elif fault_type == "offset":
            # Constant positive bias
            current_curve += 25.0
        elif fault_type == "stuck":
            # Flatline at fixed value
            current_curve = np.full_like(t, 85.0)
        elif fault_type == "noise_increase":
            # High variance Gaussian noise
            np.random.seed(int(sensor_id.replace("S", "")) if "S" in sensor_id else 42)
            current_curve += np.random.normal(0, 12.0, len(t))
        elif fault_type == "sensitivity_loss":
            # Scaled down amplitude (35% loss)
            current_curve = current_curve * 0.65
        else:
            # Healthy: tiny natural jitter
            np.random.seed(1)
            current_curve += np.random.normal(0, 1.2, len(t))

        t_list = [round(float(val), 2) for val in t]
        h_list = [round(float(val), 2) for val in healthy_curve]
        c_list = [round(float(val), 2) for val in current_curve]

        return {
            "sensor_id": sensor_id,
            "time_seconds": t_list,
            "time_steps_s": t_list,
            "healthy_reference": h_list,
            "healthy_reference_curve": h_list,
            "current_curve": c_list,
            "current_response_curve": c_list,
            "detected_fault": fault_type,
            "metrics_delta": {
                "response_time_pct": "+42%" if fault_type == "slow_response" else "+2%",
                "recovery_time_pct": "+35%" if fault_type == "slow_response" else "-1%",
                "baseline_drift": "+22 ppm" if fault_type in ["drift", "offset"] else "+1 ppm",
                "noise_level_pct": "+65%" if fault_type == "noise_increase" else "+4%"
            }
        }

    def get_sensor_diagnostic_summary(self, sensor_id: str) -> Dict[str, Any]:
        """Provides full diagnostic packet for a given sensor ID."""
        pos_df = data_loader.get_sensor_positions()
        sensor_info = pos_df[pos_df["sensor_id"] == sensor_id]
        
        zone = sensor_info["zone"].iloc[0] if len(sensor_info) > 0 else "Zone-A"
        sensor_type = sensor_info["sensor_type"].iloc[0] if len(sensor_info) > 0 else "MQ-Generic"
        cal_age = int(sensor_info["calibration_age_days"].iloc[0]) if len(sensor_info) > 0 else 30

        # Sample realistic fault behavior for demonstration
        fault_assignment = {
            "S01": ("healthy", 96.0, "none"),
            "S02": ("healthy", 92.0, "none"),
            "S03": ("suspected_faulty", 43.0, "slow_response"),
            "S04": ("warning", 78.0, "noise_increase"),
            "S05": ("healthy", 88.0, "none"),
            "S06": ("suspected_faulty", 54.0, "offset"),
            "S07": ("healthy", 91.0, "none"),
            "S08": ("healthy", 94.0, "none"),
            "S09": ("healthy", 89.0, "none"),
            "S10": ("warning", 68.0, "drift"),
            "S11": ("healthy", 93.0, "none"),
            "S12": ("healthy", 95.0, "none"),
            "S13": ("suspected_faulty", 35.0, "stuck"),
            "S14": ("warning", 72.0, "sensitivity_loss"),
            "S15": ("healthy", 90.0, "none"),
            "S16": ("healthy", 94.0, "none"),
        }

        health_status, trust, fault = fault_assignment.get(sensor_id, ("healthy", 90.0, "none"))
        fingerprint = self.generate_fingerprint_curve(sensor_id, fault)

        is_faulty = health_status == "suspected_faulty"
        trust_breakdown = trust_engine.calculate_trust_score(
            sensor_id=sensor_id,
            fault_probability=0.85 if is_faulty else 0.05,
            ae_error=1.2 if is_faulty else 0.15,
            ae_threshold=0.5,
            cusum_alarm=(fault == "drift"),
            noise_std=3.5 if fault == "noise_increase" else 1.0,
            is_stuck=(fault == "stuck"),
            diff_response_time=8.5 if fault == "slow_response" else 0.2
        )

        # 1D-CNN Autoencoder reconstruction residual timeline
        times = ["18:25", "18:35", "18:45", "18:55", "19:05", "19:15", "19:25", "19:35", "19:45", "19:55"]
        if is_faulty:
            recon_errors = [0.012, 0.014, 0.015, 0.019, 0.024, 0.032, 0.039, 0.045, 0.048, 0.052]
        elif health_status == "warning":
            recon_errors = [0.010, 0.011, 0.013, 0.016, 0.019, 0.022, 0.025, 0.026, 0.027, 0.028]
        else:
            recon_errors = [0.008, 0.009, 0.007, 0.011, 0.009, 0.010, 0.008, 0.009, 0.010, 0.008]

        reconstruction_timeline = [
            {"timestamp": t, "reconstruction_error": err}
            for t, err in zip(times, recon_errors)
        ]

        return {
            "sensor_id": sensor_id,
            "sensor_type": sensor_type,
            "zone": zone,
            "calibration_age_days": cal_age,
            "health_status": health_status,
            "trust_score": trust,
            "suspected_fault": fault,
            "fingerprint": fingerprint,
            "trust_breakdown": trust_breakdown,
            "reconstruction_timeline": reconstruction_timeline,
            "recommendations": [
                f"Inspect physical sensor {sensor_id} in {zone} for signal degradation or contamination.",
                "Verify whether ambient ventilation changes could account for transient deviation.",
                "Conduct certified span-gas verification test before clearing diagnostic warning.",
                "Follow standard operating procedure: do NOT bypass emergency safety systems."
            ]
        }

diagnostic_service = DiagnosticService()
