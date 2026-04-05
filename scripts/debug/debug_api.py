from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.post(
    "/api/v1/auth/register",
    json={
        "username": "sontrx006",
        "email": "logintest@example.com",
        "password": "StrongPass123!"
    }
)

print(f"Status Code: {response.status_code}")
try:
    print(f"Response JSON: {response.json()}")
except Exception:
    print(f"Response Text: {response.text}")
