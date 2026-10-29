import pytest
from app.services.localization import localization_engine

def test_localization_refusal_when_insufficient_sensors():
    # Only 1 reliable sensor reading above noise floor
    readings = [
        {"sensor_id": "S01", "gas_reading": 30.0, "trust_score": 95.0},
        {"sensor_id": "S02", "gas_reading": 0.5, "trust_score": 95.0},
        {"sensor_id": "S03", "gas_reading": 0.2, "trust_score": 95.0},
    ]
    res = localization_engine.estimate_location(readings, method="fault_aware", min_reliable_sensors=3)
    assert res["success"] is False
    assert res["confidence_level"] == "refused"
    assert "refused" in res["message"].lower()

def test_fault_aware_localization_resists_faulty_sensor():
    # True gas leak near Zone-C (around S10, S11, S12)
    # Sensor S01 in Zone-A is faulty with huge false reading (85 ppm) but low trust (25.0)
    readings = [
        {"sensor_id": "S01", "gas_reading": 85.0, "trust_score": 25.0},  # Faulty in Zone-A
        {"sensor_id": "S10", "gas_reading": 35.0, "trust_score": 95.0},  # Real in Zone-C
        {"sensor_id": "S11", "gas_reading": 42.0, "trust_score": 95.0},  # Real in Zone-C
        {"sensor_id": "S12", "gas_reading": 30.0, "trust_score": 95.0},  # Real in Zone-C
    ]

    base_res = localization_engine.estimate_location(readings, method="baseline", min_reliable_sensors=1)
    fa_res = localization_engine.estimate_location(readings, method="fault_aware", min_reliable_sensors=3)

    assert fa_res["success"] is True
    # Fault-aware should locate the leak in Zone-C (y >= 15.0)
    assert fa_res["estimated_zone"] in ["Zone-C", "Zone-B"]
    assert fa_res["estimated_y_m"] > 12.0
    # Baseline was heavily distorted towards Zone-A (y around 3-6m)
    assert base_res["estimated_y_m"] < fa_res["estimated_y_m"]

def test_localization_benchmark():
    res = localization_engine.run_benchmark_experiments()
    assert "experiments" in res
    assert len(res["experiments"]) >= 3
    assert res["overall_summary"]["events_evaluated"] == 30
