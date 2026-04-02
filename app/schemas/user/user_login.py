from ..user.user_base import UserBase
from pydantic import EmailStr

class UserLogin(UserBase):
    email: EmailStr 
    password: str