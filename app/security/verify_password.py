from .hashing import verify_password as bcrypt_verify

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Sử dụng hàm verify_password từ hashing.py
    """
    return bcrypt_verify(plain_password, hashed_password)