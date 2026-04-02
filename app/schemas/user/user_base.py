from pydantic import (
    BaseModel,          # Class tạo bộ lọc
    EmailStr,           # Class ép kiểu, bắt lỗi email
    field_validator    # Phương thức dùng để kiểm tra
)
from typing import Optional # Optional cho phép None

class UserBase(BaseModel):
    """Class dùng chung"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

    # Validator cho username
    @field_validator('username')
    @classmethod
    def username_format(cls, v: str) -> str:
        # Debug: Rút gọn tối đa
        if not v: return v
        if len(v) < 3:
            raise ValueError("Tên quá ngắn")
        return v
    
    # Validator cho password
    @field_validator('password')
    @classmethod
    def password_format(cls, v: str) -> str:
        # Debug: Rút gọn tối đa
        if not v: return v
        if len(v) < 8:
            raise ValueError("Password quá ngắn")
        return v