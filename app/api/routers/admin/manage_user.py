from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.schemas.user import UserRoleUpdate, UserOut
from app.schemas.common import PaginatedResponse
from app.services.user_service import update_user_role, get_user_by_id, get_users, update_user_active
from app.dependencies.user.get_current_admin import get_current_admin
from app.models.user import User

router = APIRouter()

class UserActiveUpdate(BaseModel):
    is_active: bool

@router.get("/users", response_model=PaginatedResponse[UserOut])
def list_users(
    page: int = 1,
    limit: int = 20,
    q: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    if page < 1:
        page = 1
    if limit < 1:
        limit = 20

    skip = (page - 1) * limit
    data, total = get_users(db=db, skip=skip, limit=limit, q=q, role=role, is_active=is_active)
    pages = (total + limit - 1) // limit if limit else 1
    return PaginatedResponse[UserOut](data=data, total=total, page=page, limit=limit, pages=pages)

@router.patch("/{user_id}/role", response_model=UserOut)
def update_role(
    user_id: int,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    # Kiểm tra user cần update có tồn tại không
    user = get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )
    
    # Thực hiện update role
    updated_user = update_user_role(db=db, user_id=user_id, new_role=data.role)
    return updated_user

@router.patch("/{user_id}/active", response_model=UserOut)
def update_active(
    user_id: int,
    data: UserActiveUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    user = get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User không tồn tại"
        )

    updated_user = update_user_active(db=db, user_id=user_id, is_active=data.is_active)
    return updated_user
