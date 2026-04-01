from app.models.user import User
from sqlalchemy.orm import Session

def get_user_by_email(db:Session, email:str):
    """
    Tìm user theo email

    Return:
        - User nếu tồn tại
        - None nếu không tồn tại
    """

    return db.query(User).filter(User.email == email).first()

