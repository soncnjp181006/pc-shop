from fastapi.testclient import TestClient
from app.main import app # app = FastAPI

# Khởi tạo trình duyệt ảo
client = TestClient(app)

def test_ping_success():
    """
    Test endpoint GET /ping
    Test case: Đảm bảo endpoint /ping trả về đúng status 200
    Test case: Đảm bảo endpoint /ping trả về đúng JSON {"pong": True}
    """
    # response là kết quả trả về từ API 
    # assert condition (assert điều_kiện) [đúng] -> chạy tiếp
    # assert condition (assert điều_kiện) [sai]  -> báo lỗi
    # Cụ thể:
    '''
    client.get('/api/v1/health/ping')
    -> gửi request giả lập
    -> FastAPI xử lý
    -> trả về response
    -> gán vào biến response
    '''
    response = client.get('/api/v1/health/ping')
    assert response.status_code == 200 
    assert response.json() == {"pong": True}

def test_ping_wrong_method():
    """Test case: Đảm bảo endpoint /ping từ chối các HTTP method không hợp lệ"""
    response = client.post('/api/v1/health/ping')
    
    # Mã 405 -> endpoint tồn tại nhưng không cho phép method này
    assert response.status_code == 405 