import sys
import os

# Ensure we can import from 'app'
sys.path.append(os.getcwd())

from pydantic import ValidationError
from app.schemas.user.user_create import UserCreate

test_data = {
    'username': 'sontrx006',
    'email': 'logintest@example.com',
    'password': 'StrongPass123!'
}

output = []
output.append(f"Testing validation with data: {test_data}")

try:
    user = UserCreate(**test_data)
    output.append("SUCCESS: Data is valid according to UserCreate schema.")
    output.append(str(user.model_dump()))
except ValidationError as e:
    output.append("FAILURE: Validation failed!")
    for error in e.errors():
        output.append(f"Field: {error['loc']}")
        output.append(f"Message: {error['msg']}")
        output.append(f"Type: {error['type']}")
        output.append("-" * 20)
except Exception as e:
    output.append(f"AN UNEXPECTED ERROR OCCURRED: {e}")

with open("pydantic_debug.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output))
