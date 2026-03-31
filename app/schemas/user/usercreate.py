from pydantic import (
    BaseModel,          # Class tạo bộ lọc
    EmailStr,           # Class ép kiểu emai; 
    field_serializer    # Phương thức dùng để kiểm tra
)
import re
from typing import Optional # Optional cho phép None

# Import class cha UserBase(BaseModel) để đa kế thừa
from ..user.userbase import UserBase
        

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
    email:str
    password:str

    
    
    

    