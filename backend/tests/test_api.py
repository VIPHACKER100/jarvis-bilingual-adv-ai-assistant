import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200

def test_api_system_status():
    response = client.get("/api/v1/system/status")
    # 200 with valid key, 403 without — 404 means wrong route
    assert response.status_code in [200, 403]
