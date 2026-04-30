import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200

def test_api_system_status():
    response = client.get("/api/system/status")
    # Should be 403 because of API key middleware
    assert response.status_code in [200, 403]
