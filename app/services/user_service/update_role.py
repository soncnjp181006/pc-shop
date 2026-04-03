from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.repositories.user_repo.update_role import update_user_role_repo

def update_user_role(db: Session, user_id: int, new_role: UserRole) -> User:
    return update_user_role_repo(db=db, user_id=user_id, new_role=new_role)
