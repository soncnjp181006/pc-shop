"""
Router Auth - Xử lý tất cả các endpoint liên quan đến xác thực
    - POST /register
    - POST /login
    ....
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
# OAuth2PasswordRequestForm: Form chuẩn OAuth2, có sẵn field username + password.
# FastAPI tự parse form data và inject vào function.
# => dùng "username" thay vì "email" vì đây là chuẩn OAuth2.

from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserOut

from app.services.user_service import (
    create_user,
    get_user_by_email,
    get_user_by_id
)
from app.db.session import get_db

from app.security.hashing import hash_password


router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in:UserCreate, db:Session=Depends(get_db)):
    """
    API đăng ký tài khoản mới

    Steps:
        1. Kiểm tra email đã tồn tại chưa
        2. Tạo user qua service layer
        3. Trả về UserOut (Không chứa password)

    Error handling:
        - Email trùng -> 409 Conflict
        - Validation lỗi (Pydantic tự xử lý) -> 422
    """

    # Kiểm tra email unique
    existing_user = get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email đã được sử dụng. Vui lòng chọn email khác"
        )
    
    # Tạo user (service layer xử lý commit + refresh)
    user = create_user(
        db=db,
        username=user_in.username,
        email=user_in.email,
        password=user_in.password
    )

    return user