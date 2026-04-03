import sys
import os

with open('test_direct_out2.txt', 'w') as f:
    sys.stdout = f
    sys.stderr = f
    try:
        sys.path.append(os.getcwd())
        from app.db.session import SessionLocal
        from app.models.category import Category
        
        db = SessionLocal()
        # Find a valid category
        cat = db.query(Category).first()
        if not cat:
            print("No category found!")
        else:
            print("Found category", cat.id)

        from app.main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)

        class MockUser:
            id = 1
            username = "admin"
            role = "admin"

        from app.dependencies.user.get_current_user import get_current_user
        app.dependency_overrides[get_current_user] = lambda: MockUser()

        payload = {
            "name": "Testing Save Again",
            "slug": "test-save-102",
            "category_id": cat.id if cat else 1,
            "seller_id": 1,
            "base_price": 500000.0,
            "stock_quantity": 42
        }

        print("Testing POST /api/v1/products/")
        r = client.post("/api/v1/products/", json=payload)
        print("Status POST:", r.status_code)
        print("Body POST:", r.text)
    except Exception as e:
        import traceback
        print("ERROR:", traceback.format_exc())
