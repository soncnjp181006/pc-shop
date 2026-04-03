import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import engine, get_db

@pytest.fixture
def db_session():
    """
    Tạo sesion DB tạm thời cho test
    Mỗi test chạy xong sẽ rollback toàn bộ thay đổi
    -> DB luôn sạch giữa các test
    """
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
