import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User, UserRole
from sqlalchemy.orm import Session

def test_admin_update_user_role_success(client, registered_user, db_session: Session):
    """Test ADMIN cập nhật role thành công"""
    # 1. Tạo một user mới cần được nâng cấp
    client.post(
        '/api/v1/auth/register',
        json={
            'username': 'customer_user',
            'email': 'customer@example.com',
            'password': 'Password123!'
        }
    )
    user_to_update = db_session.query(User).filter(User.email == 'customer@example.com').first()
    assert user_to_update.role == UserRole.CUSTOMER.value

    # 2. Tạo một ADMIN user và lấy token
    # (Để đơn giản, ta register rồi update role trong DB cho nó thành ADMIN)
    client.post(
        '/api/v1/auth/register',
        json={
            'username': 'admin_user',
            'email': 'admin@example.com',
            'password': 'AdminPassword123!'
        }
    )
    admin_user = db_session.query(User).filter(User.email == 'admin@example.com').first()
    admin_user.role = UserRole.ADMIN.value
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "AdminPassword123!"}
    )
    assert "role" in login_response.json()
    assert login_response.json()["role"] == UserRole.ADMIN.value
    admin_token = login_response.json()["access_token"]

    # 3. ADMIN gọi API cập nhật role cho user_to_update thành SELLER
    response = client.patch(
        f"/api/v1/admin/{user_to_update.id}/role",
        json={"role": UserRole.SELLER.value},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    assert response.json()["role"] == UserRole.SELLER.value
    
    # Verify lại trong DB
    db_session.refresh(user_to_update)
    assert user_to_update.role == UserRole.SELLER.value

def test_non_admin_cannot_update_role(client, registered_user, db_session: Session):
    """Test user thường KHÔNG có quyền cập nhật role"""
    # 1. Lấy token của user thường
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]}
    )
    user_token = login_response.json()["access_token"]
    user_id = db_session.query(User).filter(User.email == registered_user["email"]).first().id

    # 2. Thử tự update role cho chính mình thành ADMIN
    response = client.patch(
        f"/api/v1/admin/{user_id}/role",
        json={"role": UserRole.ADMIN.value},
        headers={"Authorization": f"Bearer {user_token}"}
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Bạn không có quyền truy cập chức năng này"

def test_admin_update_non_existent_user(client, db_session: Session):
    """Test ADMIN cập nhật role cho user không tồn tại"""
    # 1. Tạo ADMIN
    client.post(
        '/api/v1/auth/register',
        json={'username': 'admin2', 'email': 'admin2@example.com', 'password': 'AdminPassword123!'}
    )
    admin_user = db_session.query(User).filter(User.email == 'admin2@example.com').first()
    admin_user.role = UserRole.ADMIN.value
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin2@example.com", "password": "AdminPassword123!"}
    )
    admin_token = login_response.json()["access_token"]

    # 2. Update user ID 99999
    response = client.patch(
        "/api/v1/admin/99999/role",
        json={"role": UserRole.ADMIN.value},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User không tồn tại"
