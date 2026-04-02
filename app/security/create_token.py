from ..core.config import settings
from datetime import datetime, timedelta, timezone
from jose import jwt 

def create_token(user_id:int)->str:
    # Tính thời điểm hết hạn
    expire_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # Xây dựng Payload 
    payload = {
        "sub": str(user_id), # user_id: str
        "exp": expire_at     # thời điểm hết hạn 
    }

    # Ký và tạo token 
    token = jwt.encode(
        payload,
        settings.SECRET_KEY, 
        settings.ALGORITHM
    )

    # Trả về token
    return token