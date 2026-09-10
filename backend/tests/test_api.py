from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200


def test_api_system_status():
    response = client.get("/api/v1/system/status")
    # TestClient connects from 127.0.0.1, so the localhost auth bypass applies
    # and the endpoint must answer 200 (errors are carried in the body, not the status)
    assert response.status_code == 200
