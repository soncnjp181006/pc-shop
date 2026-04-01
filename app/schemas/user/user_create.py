from pydantic import (
    EmailStr,           # Class ép kiểu emai; 
)
# Import class cha UserBase(BaseModel) để đa kế thừa
from .user_base import UserBase
        

class UserCreate(UserBase):
    """
    Schema nhận dữ liệu khi đăng ký

    Client gửi:
        POST /api/v1/auth/register
        {
            "email": "user@example.com", 
            "password" : "TranXuanSon006"
        }
    """
    username:str
    email:EmailStr
    password:str

    # Tự kế thừa username_format
    # Tự kế thừa password_format