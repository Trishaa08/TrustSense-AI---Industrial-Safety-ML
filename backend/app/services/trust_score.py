from typing import Dict, Any, List, Optional
import numpy as np
import logging

logger = logging.getLogger("trustsense.trust_score")

DEFAULT_WEIGHTS = {
    "supervised_fault_weight": 35.0,     # Max deduction from RF / Fusion fault probability
    "autoencoder_weight": 20.0,          # Max deduction from reconstruction anomaly
    "drift_cusum_weight": 15.0,          # Max deduction from sustained CUSUM drift
    "noise_weight": 10.0,                # Max deduction from excessive noise std
    "stuck_weight": 15.0,                # Max deduction from flatlined reading
    "reference_deviation_weight": 15.0,   # Max deduction from reference curve mismatch
}

class TrustScoreEngine:
    """
    Computes a transparent, evidence-based 0 to 100 Sensor Trust Score.
    
    Formula:
    Trust = 100 - (W_fault * P_fault + W_ae * AE_penalty + W_drift * Drift_penalty 
                   + W_noise * Noise_penalty + W_stuck * Stuck_penalty + W_ref * Ref_penalty)
    Capped within [0, 100].
    """
    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights if weights is not None else DEFAULT_WEIGHTS.copy()

    def update_weights(self, new_weights: Dict[str, float]):
        for k, v in new_weights.items():
            if k in self.weights:
                self.weights[k] = float(v)

    def calculate_trust_score(
        self,
        sensor_id: str,
        fault_probability: float = 0.0,
        ae_error: float = 0.0,
        ae_threshold: float = 0.5,
        cusum_alarm: bool = False,
        noise_std: float = 1.0,
        nominal_noise_std: float = 1.0,
        is_stuck: bool = False,
        diff_response_time: float = 0.0,
        diff_pulse_curve: float = 0.0
    ) -> Dict[str, Any]:
        """Calculates trust score and produces specific evidence-based reasons."""
        reasons: List[str] = []

        # 1. Fault Model Penalty
        p_fault = np.clip(fault_probability, 0.0, 1.0)
        p_fault_penalty = p_fault * self.weights["supervised_fault_weight"]
        if p_fault > 0.40:
            reasons.append(f"Model indicated {int(p_fault * 100)}% probability of hardware/signal degradation (-{p_fault_penalty:.1f} pts)")

        # 2. Autoencoder Reconstruction Penalty
        ae_ratio = ae_error / (ae_threshold + 1e-6)
        if ae_ratio > 1.0:
            ae_excess = min(1.0, (ae_ratio - 1.0) / 2.0)
            ae_penalty = ae_excess * self.weights["autoencoder_weight"]
            reasons.append(f"Reconstruction MSE ({ae_error:.3f}) exceeded healthy envelope by {int((ae_ratio - 1.0) * 100)}% (-{ae_penalty:.1f} pts)")
        else:
            ae_penalty = 0.0

        # 3. Drift / CUSUM Penalty
        if cusum_alarm:
            drift_penalty = self.weights["drift_cusum_weight"]
            reasons.append(f"CUSUM detector flagged persistent baseline shift/drift (-{drift_penalty:.1f} pts)")
        else:
            drift_penalty = 0.0

        # 4. Noise Penalty
        if noise_std > (nominal_noise_std * 2.0):
            noise_ratio = min(1.0, (noise_std - nominal_noise_std) / (nominal_noise_std * 3.0))
            noise_penalty = noise_ratio * self.weights["noise_weight"]
            reasons.append(f"High-frequency noise ({noise_std:.2f}) elevated above expected nominal levels (-{noise_penalty:.1f} pts)")
        else:
            noise_penalty = 0.0

        # 5. Stuck Sensor Penalty
        if is_stuck:
            stuck_penalty = self.weights["stuck_weight"]
            reasons.append(f"Sensor signal showed zero variance while environmental conditions fluctuated (-{stuck_penalty:.1f} pts)")
        else:
            stuck_penalty = 0.0

        # 6. Reference Profile Deviation Penalty
        ref_dev = (abs(diff_response_time) / 10.0) + (abs(diff_pulse_curve) / 0.15)
        if ref_dev > 0.5:
            ref_factor = min(1.0, ref_dev / 2.0)
            ref_penalty = ref_factor * self.weights["reference_deviation_weight"]
            reasons.append(f"Response dynamic curve diverged from sensor calibration fingerprint (-{ref_penalty:.1f} pts)")
        else:
            ref_penalty = 0.0

        total_penalty = p_fault_penalty + ae_penalty + drift_penalty + noise_penalty + stuck_penalty + ref_penalty
        trust_score = float(np.clip(100.0 - total_penalty, 0.0, 100.0))

        # Health Label
        if trust_score >= 80.0:
            health_label = "healthy"
            advice = "Sensor operating normally within nominal healthy specifications."
        elif trust_score >= 55.0:
            health_label = "warning"
            advice = "Monitor sensor trend; schedule routine drift check during next maintenance window."
        else:
            health_label = "suspected_faulty"
            advice = "Inspect wiring, perform zero-gas bump test, or recalibrate sensor. Do NOT rely on this sensor for standalone localization."

        if not reasons:
            reasons.append("All physical parameters and model outputs within nominal tolerances.")

        return {
            "sensor_id": sensor_id,
            "trust_score": round(trust_score, 1),
            "health_label": health_label,
            "penalties": {
                "fault_probability": round(p_fault_penalty, 1),
                "autoencoder_anomaly": round(ae_penalty, 1),
                "drift_cusum": round(drift_penalty, 1),
                "excessive_noise": round(noise_penalty, 1),
                "stuck_reading": round(stuck_penalty, 1),
                "reference_deviation": round(ref_penalty, 1)
            },
            "contributing_reasons": reasons,
            "recommended_action": advice,
            "weights_used": self.weights.copy()
        }

trust_engine = TrustScoreEngine()
