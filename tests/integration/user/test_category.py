import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import UserRole
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.category import Category

@pytest.fixture
def admin_token(client, db_session: Session):
    """
    Tạo một ADMIN user và lấy token
    """
    client.post(
        '/api/v1/auth/register',
        json={
            'username': 'admin_cat',
            'email': 'admin_cat@example.com',
            'password': 'AdminPassword123!'
        }
    )
    admin_user = db_session.query(User).filter(User.email == 'admin_cat@example.com').first()
    admin_user.role = UserRole.ADMIN.value
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin_cat@example.com", "password": "AdminPassword123!"}
    )
    return login_response.json()["access_token"]

def test_create_category_tree(client, admin_token, db_session: Session):
    """
    Test tạo parent "Thời trang" và child "Áo"
    """
    # 1. Tạo Parent "Thời trang"
    response_parent = client.post(
        "/api/v1/categories/",
        json={
            "name": "Thời trang",
            "slug": "thoi-trang",
            "parent_id": None
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response_parent.status_code == 201
    parent_id = response_parent.json()["id"]

    # 2. Tạo Child "Áo"
    response_child = client.post(
        "/api/v1/categories/",
        json={
            "name": "Áo",
            "slug": "ao",
            "parent_id": parent_id
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response_child.status_code == 201
    child_id = response_child.json()["id"]

    # 3. Kiểm tra cây thư mục
    response_tree = client.get("/api/v1/categories/tree")
    assert response_tree.status_code == 200
    tree_data = response_tree.json()
    
    # Tìm node "Thời trang" trong roots
    parent_node = next((node for node in tree_data if node["id"] == parent_id), None)
    assert parent_node is not None
    assert parent_node["name"] == "Thời trang"
    
    # Kiểm tra children của "Thời trang"
    assert len(parent_node["children"]) == 1
    assert parent_node["children"][0]["id"] == child_id
    assert parent_node["children"][0]["name"] == "Áo"

def test_soft_delete_child_not_affect_parent(client, admin_token, db_session: Session):
    """
    Xoá child không ảnh hưởng parent
    """
    # 1. Tạo Parent
    res_p = client.post(
        "/api/v1/categories/",
        json={"name": "Điện tử", "slug": "dien-tu"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    p_id = res_p.json()["id"]

    # 2. Tạo Child
    res_c = client.post(
        "/api/v1/categories/",
        json={"name": "Laptop", "slug": "laptop", "parent_id": p_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    c_id = res_c.json()["id"]

    # 3. Soft Delete Child
    del_res = client.delete(
        f"/api/v1/categories/{c_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert del_res.status_code == 200
    assert del_res.json()["is_active"] == False

    # 4. Kiểm tra Parent vẫn Active
    parent_res = client.get(f"/api/v1/categories/{p_id}")
    assert parent_res.status_code == 200
    assert parent_res.json()["is_active"] == True

    # 5. Kiểm tra cây thư mục (active_only=True) -> không còn Laptop
    tree_res = client.get("/api/v1/categories/tree?active_only=True")
    p_node = next((node for node in tree_res.json() if node["id"] == p_id), None)
    assert p_node is not None
    assert len(p_node["children"]) == 0
