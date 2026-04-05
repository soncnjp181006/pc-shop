import urllib.request
import json
import traceback

def run():
    url = "http://localhost:8000/api/v1/products/"
    data = {
        "name": "Test Builtin",
        "slug": "test-builtin-12345",
        "category_id": 1,
        "seller_id": 1,
        "base_price": 500000,
        "stock_quantity": 42,
        "image_url": None,
        "is_active": True
    }
    
    req = urllib.request.Request(url, method="POST")
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json')
    
    try:
        data_bytes = json.dumps(data).encode('utf-8')
        with urllib.request.urlopen(req, data=data_bytes) as response:
            return f"SUCCESS: {response.status}\n{response.read().decode('utf-8')}"
    except urllib.error.HTTPError as e:
        return f"HTTP ERROR: {e.code}\n{e.read().decode('utf-8')}"
    except Exception as e:
        return f"GENERIC ERROR: {str(e)}\n{traceback.format_exc()}"

if __name__ == "__main__":
    result = run()
    import os
    file_path = os.path.join(os.getcwd(), 'logs', 'diagnostic_out.txt')
    with open(file_path, 'w') as f:
        f.write(result)
