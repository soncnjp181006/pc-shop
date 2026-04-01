"""
API đăng ký tài khoản

Mục tiêu:
Kiểm tra toàn bộ luồng đăng ký theo đúng yêu cầu production
    - Đảm bảo API hoạt động đúng
    - Validate input
    - Password được hash
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.db.session import get_db

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(bind=connection)
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.rollback()
        transaction.rollback()
        db.close()
        connection.close()

@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db]=lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_register_success(client, db_session):
    """
    Test case 1: Đăng ký thành công email mới
        - Trả về 201
        - Trả về UserOut (có id, email, không có password)
        - Password trong DB phải được hash (bắt đầu bằng $2b$)
    """
    email =  "soncnjp@example.com"

    # Client post theo UserCreate
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "soncnjp",
            "email": email,
            "password": "sontrxcn2006"
        }
    )

    # Kiểm tra trả về có theo UserOut không
    assert response.status_code == 201 # CREATED SUCCESS
    data = response.json()
    assert data["email"] == email
    assert "id" in data
    assert "username" in data
    assert "role" in data
    assert "is_active" in data

    # password không được chứa trong data
    assert "password" not in data

    # password phải được hash trong DB
    user_in_db = db_session.query(User).filter(User.email == email).first()
    assert user_in_db is not None
    assert user_in_db.hashed_password.startswith('$2b$')


def test_register_duplicate_email(client):
    """
    Test case 2: Email đã tồn tại -> 409 Conflict
    """

    # Tạo user trước
    client.post(
        "/api/v1/auth/regiter",
        json={
            "email": "duplicate@example.com",
            "password": "soncnjp2006"
        }
    )

    # Đăng ký email trùng lại
    response = client.post(
        "/api/v1/auth/regiter",
        json={
            "email": "duplicate@example.com",
            "password": "pass123SSS"
        }
    )

    assert response.status_code == 409
    assert "email" in response.json()["detail"].lower()  # Thông báo rõ ràng


def test_register_missing_fields(client):
    """
    Test case 3: Thiếu một trường dữ liệu -> 422 Validation Error
    """

    # Thiếu username
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "missingpass@example.com",
            "password": "passs12333546"
        }
    )
    assert response.status_code == 422

    # Thiếu password
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "soncnjp2006",
            "email": "missingpass@example.com"
        }
    )
    assert response.status_code == 422

    # Thiếu email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "soncnjp2006",
            "password": "StrongPass123"
        }
    )
    assert response.status_code == 422


def test_register_password_too_short(client):
    """
    Test case 4: Password quá ngắn
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "soncnjp2006",
            "email": "short@example.com", 
            "password": "123"
        }
    )
    assert response.status_code == 422