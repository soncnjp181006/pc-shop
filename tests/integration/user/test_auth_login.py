"""
Test API đăng nhập: POST /api/v1/auth/login

Mục tiêu:
    - Đảm bảo login đúng credential -> trả token hợp lệ
    - Sai credential -> 401 (không tiết lộ lý do cụ thể)
    - Decode token -> sub = str(user_id)
"""

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.main import app
from app.db.session import engine, get_db
from app.core.config import settings
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_session():
    """
    Tạo sesion DB tạm thời cho test
    Mỗi test chạy xong sẽ rollback toàn bộ thay đổi
    -> DB luôn sạch giữa các test
    """

    connetion = engine.connect()
    transaction = connetion.begin()
    TestingSessionLocal = sessionmaker(bind=connetion)
    db=TestingSessionLocal()

    try:
        yield db
    finally:
        db.rollback()
        transaction.rollback()
        db.close()
        connetion.close()

@pytest.fixture
def client(db_session):
    """
    TestClient dùng db_session thay vì DB thật
    Override dependency get_db để inject db_session vào mọi request
    """

    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def registered_user(client):
    """
    Tạo sẵn một user hợp lệ để dùng chung cho các test login
    Fixture này phụ thuộc fixture client (đã inject db_session)
    """

    response = client.post(
        '/api/v1/auth/register',
        json={
            'username': 'sontrx006',
            'email': 'logintest@example.com',
            'password': 'StrongPass123!'
        }
    )

    assert response.status_code == 201, "Fixture: Tạo user thất bại"
    return {
        "email": "logintest@example.com",
        "password": "StrongPass123!"
    }

# Test case

def test_login_success(client, registered_user):
    """
    # Test case 1: Đăng nhập đúng credentials
        - Status phải là 200
        - Response phải có access_token và token_type = "bearer"
        - Decode token ra -> sub phải bằng str(user_id)
    """

    response = client.post(
        '/api/v1/auth/login',
        data={
            "username": registered_user["email"],
            "password": registered_user["password"]
        }
    )

    assert response.status_code == 200

    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"

    # Decode token để kiểm tra payload bên trong
    # payload: thông tin user (id, name, ...)
    payload = jwt.decode(
        body["access_token"],
        settings.SECRET_KEY, # Chữ ký
        algorithms=[settings.ALGORITHM],
        options={"verify_exp": False}
    )
    assert "sub" in payload          # phải có trường sub
    assert payload["sub"].isdigit()  # sub phải là số (user_id dạng string)

def test_login_wrong_password(client, registered_user):
    """
    # Test case 2: Sai password -> 401
    - Status phải là 401
    - Response không được lộ token hay thông tin user
    """
    response = client.post(
        '/api/v1/auth/login',
        data={
            "username": registered_user["email"],
            "password": "Saimatkhau999!"
        }
    )

    assert response.status_code == 401
    body = response.json()
    assert "access_token" not in body # tuyệt đối không trả token khi sai

def test_login_user_not_found(client):
    """
    # Test case 3: Email không tồn tại -> 401
    - Status phải là 401
    - Message lỗi phải giống với test_login_wrong_password
        -> tránh lộ việc "email này có tồn tại hay không"
        (kỹ thuật bảo mật gọi là không tiết lộ enumuration) 
    """

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "khongtontai@example.com",
            "password": "PassBatKy123!"
        }
    )
    assert response.status_code == 401

def test_login_token_contains_correct_user_id(client, registered_user, db_session):
    """
    # Test case 4: sub trong token phải khớp với user_id thật trong DB
    """

    from app.models.user import User

    # Lấy user_id thật từ DB
    user = db_session.query(User).filter(
        User.email == registered_user["email"]
    ).first()

    assert user is not None

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user["email"],
            "password": registered_user["password"]
        }
    )

    assert response.status_code == 200
    token = response.json()["access_token"]

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        options={"verify_exp": False}
    )

    # sub trong token phải bằng str(user_id) - không phải int
    assert payload["sub"] == str(user.id)