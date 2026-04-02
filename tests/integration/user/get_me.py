import pytest
from fastapi.testclient import TestClient
from datetime import timedelta
from app.main import app
from app.security import create_access_token

client = TestClient(app)

def test_get_me_with_valid_token(test_user_token):
    """
    Test case 1. Token hợp lệ -> 200 + trả đúng user data
    """

    response = client.get(
        "/api/v1/users/me",
        headers={
            "Authorization": f"Bearer {test_user_token}"
        })
    
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "username" in data
    assert "email" in data
    assert "role" in data
    assert "is_active" in data
    assert "hashed_password" not in data

def test_get_me_without_token():
    """
    Test case 2. Token không có token -> 401
    """
    response = client.get(
        "/api/v1/users/me",
    )
    
    assert response.status_code == 401
   
def test_get_me_with_face_token():
    """
    Test case 3: Token giả mạo (sai chữ ký) -> 401

    Arrange: Tạo token giả (không dùng SECRET_KEY đúng)
    Act: GET /api/v1/users/me với fake token
    Assert: status 401

    Giải thích:
        Token giả là chuỗi JWT-like nhưng signature sai
        Khi decode → verify signature fail → raise JWTError → 401
    """
    fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTkifQ.FAKE_SIGNATURE"
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {fake_token}"}
    )
    assert response.status_code == 401


def test_get_me_with_expired_token():
    """
    Test case 4: Token hết hạn -> 401

    Arrange: Tạo token với expires_delta âm (đã hết hạn từ trước)
    Act: GET /api/v1/users/me với expired token
    Assert: status 401
    
    Giải thích:
        Token hết hạn = token có exp < thời điểm hiện tại
        python-jose tự detect → raise ExpiredSignatureError → 401
    """
    # Tạo token đã hết hạn: expires_delta âm = hết hạn ngay lập tức
    expired_token = create_access_token(
        user_id=1,
        expires_delta=timedelta(seconds=-1) # hết hạn 1 giây trước
    )
    response = client.get(
        "/api/v1/users/me",
        headers={
            "Authorization": f"Bearer {expired_token}"
        }
    )
    assert response.status_code == 401
    