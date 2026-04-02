import sys
import os

# Thêm app vào path để import được
sys.path.append(os.getcwd())

try:
    from app.services.user_service import get_user_by_email, get_user_by_id
    print("Import successful!")
    
    # Kiểm tra xem function có tồn tại không
    if callable(get_user_by_email) and callable(get_user_by_id):
        print("Functions are callable.")
    else:
        print("Functions are not callable.")
        
except Exception as e:
    print(f"Error: {e}")
