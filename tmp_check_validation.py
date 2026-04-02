import sys
import os
from pydantic import ValidationError

# Thêm app vào path để import được
sys.path.append(os.getcwd())

try:
    from app.schemas.user.user_create import UserCreate
    
    data = {
        'username': 'sontrx006',
        'email': 'logintest@example.com',
        'password': 'StrongPass123!'
    }
    
    try:
        user = UserCreate(**data)
        print("Validation success!")
        print(user)
    except ValidationError as e:
        print("Validation failed!")
        print(e)
        
except Exception as e:
    print(f"Error during import/setup: {e}")
