from pydantic import (
    BaseModel,          # Class tạo bộ lọc
    EmailStr,           # Class ép kiểu, bắt lỗi email
    field_validator     # Pydantic v2 validator
)
from typing import Optional # Optional cho phép None

class UserBase(BaseModel):
    """Class dùng chung"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

    @field_validator('username')
    @classmethod
    def username_format(cls, v: Optional[str]) -> Optional[str]:
        """Validator cho username: 3-50 ký tự"""
        if v is None:
            return v
        if not (3 <= len(v) <= 50):
            raise ValueError('Username phải từ 3 đến 50 ký tự')
        return v

    @field_validator('password')
    @classmethod
    def password_format(cls, v: Optional[str]) -> Optional[str]:
        """Validator cho password: tối thiểu 8 ký tự"""
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError('Mật khẩu phải có ít nhất 8 ký tự')
        return v