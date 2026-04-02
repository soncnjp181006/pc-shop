import sys
import os
from fastapi.testclient import TestClient

# Ensure we can import from 'app'
sys.path.append(os.getcwd())

try:
    from app.main import app
    client = TestClient(app)

    data = {
        "username": "sontrx006",
        "email": "logintest@example.com",
        "password": "StrongPass123!"
    }

    print(f"Sending POST to /api/v1/auth/register with data: {data}")
    response = client.post("/api/v1/auth/register", json=data)

    print(f"Status Code: {response.status_code}")
    if response.status_code == 422:
        print("Detailed 422 errors:")
        print(response.json())
    else:
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
