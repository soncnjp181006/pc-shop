from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, Tuple, List
from app.models.user import User

def get_user_by_id_repo(db:Session, user_id:int):
    return db.query(User).filter(User.id == user_id).first()

def get_users_repo(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    q: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
) -> Tuple[List[User], int]:
    query = db.query(User)

    if q:
        like = f"%{q}%"
        query = query.filter(or_(User.username.ilike(like), User.email.ilike(like)))

    if role:
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    data = query.order_by(User.id.desc()).offset(skip).limit(limit).all()
    return data, total

def update_user_active_repo(db: Session, user_id: int, is_active: bool) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user
