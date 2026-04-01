from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# CryptContext quản lý thuật toán hash.
# schemes=["bcrypt"]: dùng bcrypt (thuật toán mạnh, có salt tự động, chậm có chủ đích).
# deprecated="auto": tự động nâng cấp hash cũ sang scheme mới khi user login.


def hash_password(password: str) -> str:
    """
    Hash password trước khi lưu vào DB

    Ví dụ:
        "StrongPass123"  →  "$2b$12$KIXaBc..."

    Tại sao bcrypt chậm có chủ đích?
        → Mỗi lần hash mất ~100ms. Với attacker dùng brute force,
        100ms/attempt × 1 tỷ lần = rất lâu. Với user login, 100ms là chấp nhận được.
    """

    return pwd_context.hash(password)
