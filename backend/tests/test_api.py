import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "safety_disclaimer" in data

def test_system_status():
    resp = client.get("/api/v1/system/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_sensors"] == 16
    assert "average_trust_score" in data
    assert "highest_gas_reading" in data

def test_list_sensors():
    resp = client.get("/api/v1/sensors")
    assert resp.status_code == 200
    data = resp.json()
    assert "sensors" in data
    assert len(data["sensors"]) == 16
    s01 = data["sensors"][0]
    assert "sensor_id" in s01
    assert "trust_score" in s01
    assert "health_status" in s01

def test_sensor_fingerprint():
    resp = client.get("/api/v1/sensors/S03/fingerprint")
    assert resp.status_code == 200
    data = resp.json()
    assert "healthy_reference" in data
    assert "current_curve" in data
    assert len(data["time_seconds"]) == 101

def test_alerts_and_acknowledge():
    resp = client.get("/api/v1/alerts")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["alerts"]) >= 1
    alert_id = data["alerts"][0]["alert_id"]

    # Acknowledge
    ack_resp = client.post(
        f"/api/v1/alerts/{alert_id}/acknowledge",
        json={"status": "acknowledged", "analyst_name": "Test Analyst", "notes": "Automated test note"}
    )
    assert ack_resp.status_code == 200
    assert ack_resp.json()["alert"]["status"] == "acknowledged"

def test_simulation_step():
    resp = client.get("/api/v1/simulation/step/10")
    assert resp.status_code == 200
    data = resp.json()
    assert "timestamp" in data
    assert "sensors" in data
    assert len(data["sensors"]) > 0

def test_localization_estimate():
    payload = {
        "method": "fault_aware",
        "min_reliable_sensors": 3
    }
    resp = client.post("/api/v1/localization/estimate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "method" in data
    assert "success" in data

def test_investigation_report():
    resp = client.get("/api/v1/reports/investigation/L001")
    assert resp.status_code == 200
    data = resp.json()
    assert "report_id" in data
    assert "localization_findings" in data
    assert "safety_disclaimer" in data
