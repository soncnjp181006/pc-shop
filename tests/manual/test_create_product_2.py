import requests
import json

payload = {
    "name": "Test Product",
    "slug": "test-product-7809",
    "description": "Test",
    "base_price": 100000,
    "category_id": 1,
    "seller_id": 1,
    "image_url": None,
    "stock_quantity": 10,
    "is_active": True
}

try:
    response = requests.post("http://localhost:8000/api/v1/products/", json=payload)
    out = f"Status: {response.status_code}\nResponse: {response.text}"
except Exception as e:
    out = str(e)

with open("logs/test_create_out.txt", "w") as f:
    f.write(out)
