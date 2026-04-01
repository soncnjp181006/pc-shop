from app.models.user import User
from sqlalchemy.orm import Session

def get_user_by_email(db:Session, email:str):
    """
    Tìm user theo email

    Return:
        - User nếu tồn tại
        - None nếu không tồn tại
    """

    from app.repositories.user_repo.user_email import get_user_by_email_repo
    get_user_by_email_repo(db=db, email=email)
