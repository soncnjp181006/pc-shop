from pydantic import(
    EmailStr # Class ép kiểu, bắt lỗi email
)
from typing import Optional
from .user_base import UserBase

class UserUpdate(UserBase):
    pass # Kế thừa toàn bộ