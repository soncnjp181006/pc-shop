from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.orm import Session
from app.db.session import get_db

from app.schemas.user import (
    TokenOut
)

from app.services.user_service import (
    get_user_by_email
)

from ....security.verify_password import verify_password
from ....security.create_token import create_access_token, create_refresh_token

router = APIRouter()

@router.post('/login', response_model=TokenOut)
def login(
    form_data:OAuth2PasswordRequestForm=Depends(),
    db:Session=Depends(get_db)
):
    # Tìm user theo email
    user = get_user_by_email(db=db, email=form_data.username)

    # Kiểm tra user có tồn tại, password đúng không
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email, or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Tạo JWT token
    access_token = create_access_token(user_id=user.id)
    refresh_token = create_refresh_token(user_id=user.id)

    # Trả về token
    return TokenOut(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role
    )