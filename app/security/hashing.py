# app/security/hashing.py

import bcrypt

def hash_password(password: str) -> str:
    """
    Hash password sử dụng trực tiếp thư viện bcrypt.
    Mật khẩu đầu vào đã được Schema giới hạn tối đa 72 ký tự.
    """
    pwd_bytes = password.encode('utf-8')
    # gensalt() tự động tạo salt ngẫu nhiên
    salt = bcrypt.gensalt()
    # hashpw() thực hiện hash
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Kiểm tra mật khẩu nhập vào có khớp với hash trong DB không.
    """
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        # checkpw() tự động tách salt từ hashed_bytes và so sánh
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False