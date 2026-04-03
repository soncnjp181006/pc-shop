from sqlalchemy.orm import Session
from app.models.user import User
from typing import Optional, Tuple, List

def get_user_by_id(db:Session, user_id:int):
    """
    Tìm user theo id
    """

    # return db.query(User).filter(User.id == user_id).first()
    from app.repositories.user_repo.user_id import get_user_by_id_repo
    return get_user_by_id_repo(db=db, user_id=user_id)

def get_users(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    q: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
) -> Tuple[List[User], int]:
    from app.repositories.user_repo.user_id import get_users_repo
    return get_users_repo(db=db, skip=skip, limit=limit, q=q, role=role, is_active=is_active)

def update_user_active(db: Session, user_id: int, is_active: bool) -> Optional[User]:
    from app.repositories.user_repo.user_id import update_user_active_repo
    return update_user_active_repo(db=db, user_id=user_id, is_active=is_active)
