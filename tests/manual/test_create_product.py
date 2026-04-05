import requests

payload = {
    "name": "Test Product",
    "slug": "test-product-54321",
    "description": "Test",
    "base_price": 100000,
    "category_id": 1,
    "seller_id": 1,
    "image_url": None,
    "stock_quantity": 10,
    "is_active": True
}

response = requests.post("http://localhost:8000/api/v1/products/", json=payload)
print("Status:", response.status_code)
print("Response:", response.text)
