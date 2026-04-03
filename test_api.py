import sys
import os
import json
from fastapi.testclient import TestClient

sys.path.append(os.getcwd())

try:
    from app.main import app
    from app.db.session import SessionLocal
    from app.models.user import User

    client = TestClient(app)

    # Lấy thử 1 user admin để lấy token
    db = SessionLocal()
    admin_user = db.query(User).filter(User.is_admin == True).first()
    
    if not admin_user:
        print("Không tìm thấy admin")
        sys.exit(1)

    # Đăng nhập lấy token
    login_data = {
        "email": admin_user.email,
        "password": "password"  # Giả sử password chung
    }
    # Vì ko biết pass, ta test giả mock Dependency get_current_user
    from app.dependencies.user.get_current_user import get_current_user

    def override_get_current_user():
        return admin_user
        
    app.dependency_overrides[get_current_user] = override_get_current_user

    # Thử update sản phẩm id = 5 (kkkd)
    payload = {
        "name": "kkkd",
        "slug": "kkkd",
        "category_id": 2,
        "seller_id": admin_user.id,
        "base_price": 500000.0,
        "stock_quantity": 42
    }
    
    print("Testing Update Product:")
    response = client.put("/api/v1/products/5", json=payload)
    print("Status:", response.status_code)
    print("Response:", response.text)

    # Thử Create sản phẩm
    print("\nTesting Create Product:")
    response2 = client.post("/api/v1/products/", json=payload)
    print("Status:", response2.status_code)
    print("Response:", response2.text)

except Exception as e:
    import traceback
    print("Error:", traceback.format_exc())
