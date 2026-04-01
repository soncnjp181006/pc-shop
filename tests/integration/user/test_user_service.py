import pytest
from sqlalchemy.orm import sessionmaker
from app.db.session import engine
from app.main import app
from app.db.session import get_db
from app.models.user import User
from fastapi.testclient import TestClient

# File user_service chưa được tạo (TDD viết trước)
from app.services.user_service import (
    create_user,
    get_user_by_email,
    get_user_by_id
)

# Viết hàm dọn dẹp, tự rollback() để không làm thay đổi dữ liệu
# Khi ta thao tác create_user -> đã đụng đến DB (làm đổi dữ liệu)
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

# Override dependency get_db để TestClient sử dụng session test
@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db]=lambda:db_session
    yield TestClient(app)
    app.dependency_overrides.clear() # Dọn dẹp override sau khi test




def test_create_user_success(db_session):
    """
    Test case 1:
        - Tạo user mới thành công
        - Trả về object có id, username, email, role, is_active
        - Không có password trong output
    """

    # Tạo một đối tượng user theo UserCreate
    user = create_user(
        db=db_session,
        username='soncnjp',
        email='soncn@example.com',
        password='PassWord123'
    )

    # Kiểm tra có trả về theo UserOut không
    assert user.username is not None
    assert user.email == 'soncn@example.com'
    assert user.id is not None
    assert not hasattr(user, 'password') # Không được chứa password


def test_get_user_by_email_not_found(db_session):
    """
    Test case:
        - Email không tồn tại -> None
    """
    user = get_user_by_email(db_session, "notfound@example.com")

    assert user is None


def test_get_user_by_id_not_found(db_session):
    """
    Test case:
        - Id không tồn tại -> None
    """
    id_test = 10
    user = get_user_by_id(db_session, id_test)

    assert user is None