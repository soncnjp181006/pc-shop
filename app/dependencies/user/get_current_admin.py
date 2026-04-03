from fastapi import Depends, HTTPException, status
from app.models.user import User, UserRole
from .get_current_user import get_current_user

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập chức năng này"
        )
    return current_user
