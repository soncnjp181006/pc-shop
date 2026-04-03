import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_returns_refresh_token(registered_user):
    """Test login trả về cả access_token, refresh_token và role"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user["email"],
            "password": registered_user["password"]
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "role" in data
    assert data["role"] == "CUSTOMER"
    assert data["token_type"] == "bearer"

def test_refresh_token_success(registered_user):
    """Test refresh token thành công và trả về role"""
    # 1. Login để lấy refresh token
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user["email"],
            "password": registered_user["password"]
        }
    )
    refresh_token = login_response.json()["refresh_token"]
    
    # 2. Gọi API refresh
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert "role" in data
    assert data["role"] == "CUSTOMER"
    
def test_refresh_token_invalid():
    """Test refresh token không hợp lệ"""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token_here_1234567890"}
    )
    assert response.status_code == 401

def test_refresh_token_wrong_type(registered_user):
    """Test dùng access token để refresh -> phải lỗi"""
    # 1. Login để lấy access token
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user["email"],
            "password": registered_user["password"]
        }
    )
    access_token = login_response.json()["access_token"]
    
    # 2. Gọi API refresh với access token
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": access_token}
    )
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token type"
