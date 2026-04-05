import sys
import os

with open('logs/test_direct_out.txt', 'w') as f:
    sys.stdout = f
    sys.stderr = f
    
    try:
        import traceback
        sys.path.append(os.getcwd())
        from app.main import app
        from fastapi.testclient import TestClient

        client = TestClient(app)
        from app.models.user import User

        # Create a mock user object with basic attributes
        class MockUser:
            id = 1
            username = "admin"
            role = "admin"

        from app.dependencies.user.get_current_user import get_current_user
        app.dependency_overrides[get_current_user] = lambda: MockUser()

        payload = {
            "name": "Testing Save",
            "slug": "test-save-101",
            "category_id": 1,
            "seller_id": 1,
            "base_price": 500000.0,
            "stock_quantity": 42
        }

        print("Testing POST /api/v1/products/")
        r = client.post("/api/v1/products/", json=payload)
        print("Status POST:", r.status_code)
        print("Body POST:", r.text)

        product_id = r.json().get('id', 1) if r.status_code == 200 else 1

        payload_update = {
            "slug": "test-save-101",
            "base_price": 600000.0,
            "stock_quantity": 0,
            "image_url": None,
            "description": "[MEDIA:]"
        }
        
        print(f"Testing PUT /api/v1/products/{product_id}")
        r2 = client.put(f"/api/v1/products/{product_id}", json=payload_update)
        print("Status PUT:", r2.status_code)
        print("Body PUT:", r2.text)

    except Exception as e:
        print("ERROR:", traceback.format_exc())
