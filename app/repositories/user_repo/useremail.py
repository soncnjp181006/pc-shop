from app.models.user import User
from sqlalchemy.orm import Session

def get_user_by_email_repo(db:Session, email:str):
    return db.query(User).filter(User.email == email).first()
