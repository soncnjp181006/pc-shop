from pydantic import(
    EmailStr # Class ép kiểu, bắt lỗi email
)
from typing import Optional
from ..user.userbase import UserBase

class UserUpdate(UserBase):
    pass # Kế thừa toàn bộ