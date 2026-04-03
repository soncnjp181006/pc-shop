from sqlalchemy.orm import Session
from app.models.user import User, UserRole

def update_user_role_repo(db: Session, user_id: int, new_role: UserRole) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.role = new_role.value
        db.commit()
        db.refresh(user)
    return user
