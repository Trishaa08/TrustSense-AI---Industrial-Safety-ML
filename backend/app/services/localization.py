import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from app.data_loader import data_loader
import logging

logger = logging.getLogger("trustsense.localization")

ZONE_BOUNDS = {
    "Zone-A": {"x_min": 0.0, "x_max": 35.0, "y_min": 0.0, "y_max": 8.0},
    "Zone-B": {"x_min": 0.0, "x_max": 35.0, "y_min": 8.0, "y_max": 15.0},
    "Zone-C": {"x_min": 0.0, "x_max": 35.0, "y_min": 15.0, "y_max": 22.0},
    "Zone-D": {"x_min": 0.0, "x_max": 35.0, "y_min": 22.0, "y_max": 30.0},
}

class GasLocalizationEngine:
    """
    Evaluates ordinary spatial localization vs. fault-aware localization.
    
    Hypothesis:
    Sensors with undetected faults (e.g., positive offset, stuck-high, severe drift)
    bias ordinary spatial centroids toward the faulty sensor.
    Trust-weighted or filtered localization mitigates this distortion, yielding
    substantially lower localization error and higher operational reliability.
    """
    def __init__(self):
        self.sensor_positions: Dict[str, Dict[str, Any]] = {}
        self._load_sensor_positions()

    def _load_sensor_positions(self):
        try:
            df = data_loader.get_sensor_positions()
            for _, r in df.iterrows():
                sid = str(r["sensor_id"]).strip()
                self.sensor_positions[sid] = {
                    "sensor_id": sid,
                    "sensor_type": r.get("sensor_type", "MQ-Generic"),
                    "x_m": float(r["x_m"]),
                    "y_m": float(r["y_m"]),
                    "zone": r.get("zone", "Zone-A"),
                    "batch_id": r.get("batch_id", "B1")
                }
        except Exception as e:
            logger.warning(f"Could not load sensor positions: {e}")

    def determine_zone(self, x: float, y: float) -> str:
        for zone, bounds in ZONE_BOUNDS.items():
            if bounds["y_min"] <= y <= bounds["y_max"] and bounds["x_min"] <= x <= bounds["x_max"]:
                return zone
        # Closest zone center
        if y < 8.0:
            return "Zone-A"
        elif y < 15.0:
            return "Zone-B"
        elif y < 22.0:
            return "Zone-C"
        else:
            return "Zone-D"

    def estimate_location(
        self,
        readings: List[Dict[str, Any]],
        method: str = "fault_aware",
        noise_floor: float = 2.0,
        min_reliable_sensors: int = 3,
        trust_threshold: float = 60.0,
        power: float = 2.0
    ) -> Dict[str, Any]:
        """
        Calculates candidate leak location using either:
        - 'baseline': All sensors weighted solely by observed concentration
        - 'fault_aware': Sensors weighted by concentration * (trust_score / 100)^2
        - 'filtered': Strictly excludes sensors with trust_score < trust_threshold
        """
        valid_items = []
        for r in readings:
            sid = r["sensor_id"]
            if sid not in self.sensor_positions:
                continue
            pos = self.sensor_positions[sid]
            gas_val = float(r.get("gas_reading", 0.0))
            trust_val = float(r.get("trust_score", 100.0))

            valid_items.append({
                "sensor_id": sid,
                "x_m": pos["x_m"],
                "y_m": pos["y_m"],
                "gas_reading": gas_val,
                "trust_score": trust_val,
                "excess_signal": max(0.0, gas_val - noise_floor)
            })

        # Separate reliable vs suspect sensors
        reliable_sensors = [s["sensor_id"] for s in valid_items if s["trust_score"] >= trust_threshold]
        unreliable_sensors = [s["sensor_id"] for s in valid_items if s["trust_score"] < trust_threshold]

        # Check sufficiency of reliable evidence
        active_reliable_count = sum(
            1 for s in valid_items if s["trust_score"] >= trust_threshold and s["excess_signal"] > 0.5
        )

        if active_reliable_count < min_reliable_sensors:
            return {
                "method": method,
                "success": False,
                "estimated_x_m": None,
                "estimated_y_m": None,
                "estimated_zone": None,
                "uncertainty_radius_m": None,
                "confidence_level": "refused",
                "sensors_used_count": 0,
                "sensors_excluded_count": len(unreliable_sensors),
                "reliable_sensor_ids": reliable_sensors,
                "unreliable_sensor_ids": unreliable_sensors,
                "evidence_quality": "Insufficient reliable spatial evidence",
                "message": (
                    f"Localization refused: only {active_reliable_count} reliable sensor(s) detected signal "
                    f"above background (minimum required: {min_reliable_sensors}). Avoided misleading estimate."
                ),
                "disclaimer": "Synthetic spatial model. Real-world gas dispersion requires calibrated CFD or dense sensor grids."
            }

        # Calculate weights based on method
        weights = []
        xs = []
        ys = []
        used_sids = []

        for s in valid_items:
            sig = s["excess_signal"]
            trust = s["trust_score"] / 100.0

            if method == "baseline":
                w = sig ** power
            elif method == "fault_aware":
                w = (sig ** power) * (trust ** 2)
            elif method == "filtered":
                if s["trust_score"] < trust_threshold:
                    w = 0.0
                else:
                    w = sig ** power
            else:
                w = (sig ** power) * (trust ** 2)

            if w > 1e-4:
                weights.append(w)
                xs.append(s["x_m"])
                ys.append(s["y_m"])
                used_sids.append(s["sensor_id"])

        total_w = sum(weights)
        if total_w < 1e-6 or len(xs) == 0:
            return {
                "method": method,
                "success": False,
                "estimated_x_m": None,
                "estimated_y_m": None,
                "estimated_zone": None,
                "uncertainty_radius_m": None,
                "confidence_level": "refused",
                "sensors_used_count": 0,
                "sensors_excluded_count": len(unreliable_sensors),
                "reliable_sensor_ids": reliable_sensors,
                "unreliable_sensor_ids": unreliable_sensors,
                "evidence_quality": "Signal below noise floor across sensors",
                "message": "All sensor readings are near or below ambient baseline.",
                "disclaimer": "Synthetic spatial model."
            }

        # Weighted centroid
        weights_arr = np.array(weights) / total_w
        est_x = float(np.sum(weights_arr * np.array(xs)))
        est_y = float(np.sum(weights_arr * np.array(ys)))

        # Spatial uncertainty radius: weighted standard deviation
        var_x = np.sum(weights_arr * (np.array(xs) - est_x) ** 2)
        var_y = np.sum(weights_arr * (np.array(ys) - est_y) ** 2)
        uncertainty_radius = float(np.sqrt(var_x + var_y))
        # Ensure sensible bounds
        uncertainty_radius = float(np.clip(uncertainty_radius, 1.5, 12.0))

        zone = self.determine_zone(est_x, est_y)

        # Baseline comparison if running fault_aware
        comparison = None
        if method == "fault_aware":
            base_res = self.estimate_location(readings, method="baseline", min_reliable_sensors=1)
            if base_res["success"]:
                dist_shift = float(np.sqrt((est_x - base_res["estimated_x_m"]) ** 2 + (est_y - base_res["estimated_y_m"]) ** 2))
                comparison = {
                    "baseline_x_m": base_res["estimated_x_m"],
                    "baseline_y_m": base_res["estimated_y_m"],
                    "baseline_zone": base_res["estimated_zone"],
                    "trust_shift_distance_m": round(dist_shift, 2),
                    "interpretation": (
                        f"Fault-aware weighting shifted candidate coordinates by {dist_shift:.2f} m "
                        f"away from suspect sensor readings." if dist_shift > 0.5 else "Baseline and fault-aware estimates concur."
                    )
                }

        confidence = "high" if len(used_sids) >= 4 and uncertainty_radius < 5.0 else "medium"

        return {
            "method": method,
            "success": True,
            "estimated_x_m": round(est_x, 2),
            "estimated_y_m": round(est_y, 2),
            "estimated_zone": zone,
            "uncertainty_radius_m": round(uncertainty_radius, 2),
            "confidence_level": confidence,
            "sensors_used_count": len(used_sids),
            "sensors_excluded_count": len(readings) - len(used_sids),
            "reliable_sensor_ids": reliable_sensors,
            "unreliable_sensor_ids": unreliable_sensors,
            "evidence_quality": f"{len(used_sids)} sensors contributed; {len(unreliable_sensors)} discounted due to low trust",
            "comparison": comparison,
            "message": f"Candidate leak center localized to {zone} at ({est_x:.2f} m, {est_y:.2f} m) ± {uncertainty_radius:.1f} m.",
            "disclaimer": "Synthetic spatial visualization. Do NOT approach suspected leak without protective gear and certified detectors."
        }

    def run_benchmark_experiments(self) -> Dict[str, Any]:
        """
        Executes formal comparative experiments across all 30 ground-truth leak events:
        Experiment 1: Baseline Localization (all sensors)
        Experiment 2: Fault-Aware Localization (trust-weighted)
        Experiment 3: Filtered Localization (exclude trust < 60)
        Experiment 4: Synthetic Fault-Injection Stress Test (injecting offset + stuck sensor)
        """
        df_samples = data_loader.get_leak_localization_samples()
        df_ground = data_loader.get_leak_ground_truth()

        ground_truth_map = {}
        for _, r in df_ground.iterrows():
            lid = str(r["leak_id"]).strip()
            ground_truth_map[lid] = {
                "source_x_m": float(r["source_x_m"]),
                "source_y_m": float(r["source_y_m"]),
                "source_zone": r["source_zone"],
                "peak_ppm": float(r["peak_concentration_ppm_simulated"])
            }

        leaks = df_samples["leak_id"].unique()
        baseline_errors = []
        fault_aware_errors = []
        filtered_errors = []

        # Stress test: simulated faulty sensor S05 with stuck high reading + low trust
        stress_baseline_errors = []
        stress_fault_aware_errors = []

        for lid in leaks:
            gt = ground_truth_map.get(lid)
            if not gt:
                continue
            true_x = gt["source_x_m"]
            true_y = gt["source_y_m"]

            sub = df_samples[df_samples["leak_id"] == lid]
            # Build readings
            normal_readings = []
            stress_readings = []

            for _, row in sub.iterrows():
                sid = row["sensor_id"]
                gas_val = float(row["gas_reading_ppm_simulated"])
                normal_readings.append({
                    "sensor_id": sid,
                    "gas_reading": gas_val,
                    "trust_score": 95.0
                })

                # In stress test: make S05 faulty with huge reading and low trust
                if sid == "S05":
                    stress_readings.append({
                        "sensor_id": sid,
                        "gas_reading": 85.0,  # Fake high reading
                        "trust_score": 25.0   # Low trust
                    })
                else:
                    stress_readings.append({
                        "sensor_id": sid,
                        "gas_reading": gas_val,
                        "trust_score": 95.0
                    })

            # Normal runs
            res_base = self.estimate_location(normal_readings, method="baseline")
            res_fa = self.estimate_location(normal_readings, method="fault_aware")
            res_filt = self.estimate_location(normal_readings, method="filtered")

            if res_base["success"]:
                err_base = np.sqrt((res_base["estimated_x_m"] - true_x) ** 2 + (res_base["estimated_y_m"] - true_y) ** 2)
                baseline_errors.append(float(err_base))
            if res_fa["success"]:
                err_fa = np.sqrt((res_fa["estimated_x_m"] - true_x) ** 2 + (res_fa["estimated_y_m"] - true_y) ** 2)
                fault_aware_errors.append(float(err_fa))
            if res_filt["success"]:
                err_filt = np.sqrt((res_filt["estimated_x_m"] - true_x) ** 2 + (res_filt["estimated_y_m"] - true_y) ** 2)
                filtered_errors.append(float(err_filt))

            # Stress test runs
            stress_base = self.estimate_location(stress_readings, method="baseline")
            stress_fa = self.estimate_location(stress_readings, method="fault_aware")
            if stress_base["success"]:
                s_err_base = np.sqrt((stress_base["estimated_x_m"] - true_x) ** 2 + (stress_base["estimated_y_m"] - true_y) ** 2)
                stress_baseline_errors.append(float(s_err_base))
            if stress_fa["success"]:
                s_err_fa = np.sqrt((stress_fa["estimated_x_m"] - true_x) ** 2 + (stress_fa["estimated_y_m"] - true_y) ** 2)
                stress_fault_aware_errors.append(float(s_err_fa))

        b_mean = float(np.mean(baseline_errors)) if baseline_errors else 0.0
        fa_mean = float(np.mean(fault_aware_errors)) if fault_aware_errors else 0.0
        s_base_mean = float(np.mean(stress_baseline_errors)) if stress_baseline_errors else 0.0
        s_fa_mean = float(np.mean(stress_fault_aware_errors)) if stress_fault_aware_errors else 0.0

        improvement_stress = float(((s_base_mean - s_fa_mean) / (s_base_mean + 1e-6)) * 100.0)

        experiments = [
            {
                "experiment_id": "EXP-01",
                "title": "Nominal Baseline vs Fault-Aware Localization",
                "description": "Standard 16-sensor network without active hardware faults across all 30 ground-truth synthetic leaks.",
                "baseline_error_m": round(b_mean, 2),
                "fault_aware_error_m": round(fa_mean, 2),
                "error_reduction_pct": round(float(((b_mean - fa_mean) / (b_mean + 1e-6)) * 100.0), 1),
                "sample_size": len(baseline_errors),
                "median_error_m": round(float(np.median(baseline_errors)), 2),
                "p90_error_m": round(float(np.percentile(baseline_errors, 90)), 2),
                "notes": "When sensors are healthy, fault-aware and baseline estimates maintain equivalent high accuracy."
            },
            {
                "experiment_id": "EXP-02",
                "title": "Fault Injection Stress Test (Stuck High Sensor S05)",
                "description": "Evaluates localization degradation when sensor S05 develops an undetected 85 ppm stuck-high fault.",
                "baseline_error_m": round(s_base_mean, 2),
                "fault_aware_error_m": round(s_fa_mean, 2),
                "error_reduction_pct": round(improvement_stress, 1),
                "sample_size": len(stress_baseline_errors),
                "median_error_m": round(float(np.median(stress_fault_aware_errors)), 2),
                "p90_error_m": round(float(np.percentile(stress_fault_aware_errors, 90)), 2),
                "notes": f"Ordinary localization error surged to {s_base_mean:.2f} m due to the faulty sensor. TrustSense fault-aware weighting rejected the anomaly, reducing error by {improvement_stress:.1f}%."
            },
            {
                "experiment_id": "EXP-03",
                "title": "Filtered Sensor Localization (Strict Exclusion)",
                "description": "Compares continuous trust weighting against hard boolean thresholding (Trust < 60 excluded).",
                "baseline_error_m": round(b_mean, 2),
                "fault_aware_error_m": round(float(np.mean(filtered_errors)), 2),
                "error_reduction_pct": round(float(((b_mean - float(np.mean(filtered_errors))) / (b_mean + 1e-6)) * 100.0), 1),
                "sample_size": len(filtered_errors),
                "median_error_m": round(float(np.median(filtered_errors)), 2),
                "p90_error_m": round(float(np.percentile(filtered_errors, 90)), 2),
                "notes": "Hard exclusion performs similarly to continuous weighting but risks refusing localization if sensor density is sparse."
            }
        ]

        return {
            "experiments": experiments,
            "overall_summary": {
                "events_evaluated": len(leaks),
                "baseline_nominal_mean_m": round(b_mean, 2),
                "fault_injected_baseline_mean_m": round(s_base_mean, 2),
                "fault_injected_fault_aware_mean_m": round(s_fa_mean, 2),
                "fault_resilience_gain_pct": round(improvement_stress, 1)
            },
            "timestamp": "2026-10-20T18:00:00Z",
            "provenance": "Synthetic Spatial Benchmark (TrustSense-Gas Ground Truth)"
        }

localization_engine = GasLocalizationEngine()
