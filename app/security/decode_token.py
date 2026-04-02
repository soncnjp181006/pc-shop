from jose import jwt, JWTError,  ExpiredSignatureError
from fastapi.security import OAuth2PasswordBearer
from ..core.config import settings
from fastapi import HTTPException, status

def decode_token(token:str) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token=token,
            key=settings.SECRET_KEY,
            algorithms=settings.ALGORITHM
        )
        return payload
    except ExpiredSignatureError:
        raise credentials_exception
    
    except JWTError:
        raise credentials_exception