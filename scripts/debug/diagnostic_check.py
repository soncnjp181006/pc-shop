import sys
import os

sys.path.append(os.getcwd())

from pydantic import ValidationError
from app.schemas.user.user_create import UserCreate

test_data = {
    'username': 'sontrx006',
    'email': 'logintest@example.com',
    'password': 'StrongPass123!'
}

print(f"Testing validation with data: {test_data}")

try:
    user = UserCreate(**test_data)
    print("SUCCESS: Data is valid according to UserCreate schema.")
    print(user.model_dump())
except ValidationError as e:
    print("FAILURE: Validation failed!")
    for error in e.errors():
        print(f"Field: {error['loc']}")
        print(f"Message: {error['msg']}")
        print(f"Type: {error['type']}")
        print("-" * 20)
except Exception as e:
    print(f"AN UNEXPECTED ERROR OCCURRED: {e}")
