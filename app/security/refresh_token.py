from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib
import secrets

def create_refresh_token(user_id: int) -> str:
    # Hàm tạo refresh token cho user
    # Trả về refresh token (chuỗi)
    return secrets.token_urlsafe(32)

def hash_token(token:str) -> str:
    """Hash token trước khi lưu vào DB"""
    return hashlib.sha256(token.encode()).hexdigest()

