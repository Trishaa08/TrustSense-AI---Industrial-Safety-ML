import pytest
from app.services.trust_score import trust_engine

def test_nominal_healthy_sensor():
    res = trust_engine.calculate_trust_score(
        sensor_id="S01",
        fault_probability=0.02,
        ae_error=0.1,
        ae_threshold=0.5,
        cusum_alarm=False,
        noise_std=1.0,
        is_stuck=False
    )
    assert res["trust_score"] >= 95.0
    assert res["health_label"] == "healthy"
    assert len(res["contributing_reasons"]) >= 1

def test_suspected_faulty_sensor():
    res = trust_engine.calculate_trust_score(
        sensor_id="S03",
        fault_probability=0.90,
        ae_error=1.5,
        ae_threshold=0.5,
        cusum_alarm=True,
        noise_std=4.0,
        is_stuck=True,
        diff_response_time=12.0
    )
    assert res["trust_score"] < 50.0
    assert res["health_label"] == "suspected_faulty"
    assert len(res["contributing_reasons"]) >= 3

def test_score_bounded_0_to_100():
    res = trust_engine.calculate_trust_score(
        sensor_id="S99",
        fault_probability=1.0,
        ae_error=10.0,
        cusum_alarm=True,
        noise_std=50.0,
        is_stuck=True
    )
    assert 0.0 <= res["trust_score"] <= 100.0
