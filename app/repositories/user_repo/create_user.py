from sqlalchemy.orm.session import Session
from app.models.user import User

def create_user_repo(db:Session, user:User):
    db.add(user) # Thêm vào DB
    db.commit()
    db.refresh(user)

    return user