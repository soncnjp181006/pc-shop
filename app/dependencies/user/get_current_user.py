from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.security import decode_token, oauth2_scheme
from app.services.user_service import get_user_by_id
from app.models.user import User

def get_current_user(
    token:str=Depends(oauth2_scheme),
    db:Session=Depends(get_db)
) -> User:
    payload = decode_token(token)
    user_id: str|None = payload.get("sub")

    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    try:
        user_id = int(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    # Query user từ DB
    user = get_user_by_id(db=db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Kiểm tra user còn active
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    
    # Trả về user
    return user