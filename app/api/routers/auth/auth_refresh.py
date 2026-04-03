from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import RefreshToken, TokenOut
from app.security import decode_token, create_access_token, create_refresh_token
from jose import JWTError, ExpiredSignatureError

router = APIRouter()

@router.post('/refresh', response_model=TokenOut)
def refresh_token(
    data: RefreshToken,
    db: Session = Depends(get_db)
):
    try:
        # Giải mã refresh token
        payload = decode_token(data.refresh_token)
        
        # Kiểm tra loại token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Tạo cặp token mới
        new_access_token = create_access_token(user_id=int(user_id))
        new_refresh_token = create_refresh_token(user_id=int(user_id))
        
        return TokenOut(
            access_token=new_access_token,
            refresh_token=new_refresh_token
        )
        
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
