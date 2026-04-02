import hashlib
from .hashing import pwd_context

def verify_password(plain_password:str, hashed_password:str) -> bool:
    password_hash = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return pwd_context.verify(password_hash, hashed_password)