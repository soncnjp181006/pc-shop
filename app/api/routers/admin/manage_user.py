from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserRoleUpdate, UserOut
from app.services.user_service import update_user_role, get_user_by_id
from app.dependencies.user.get_current_admin import get_current_admin
from app.models.user import User

router = APIRouter()

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
