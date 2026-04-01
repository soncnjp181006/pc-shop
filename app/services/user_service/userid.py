from sqlalchemy.orm import Session
from app.models.user import User

def get_user_by_id(db:Session, user_id:int):
    """
    Tìm user theo id
    """

    # return db.query(User).filter(User.id == user_id).first()
    from app.repositories.user_repo.userid import get_user_by_id_repo
    get_user_by_id_repo(db=db, user_id=user_id)