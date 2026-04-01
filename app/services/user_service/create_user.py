from sqlalchemy.orm import Session
from app.models.user import User

def create_user(db:Session, username:str, email:str, password:str) -> User:
    """
    Tạo user mới:

    Steps:
        1. Tạo object User cho user
        2. Thêm vào DB
        3. Commit 
        4. Refresh để lấy id
    """

    # Hash password
    from app.security.hashing import hash_password
    hashed_pwd = hash_password(password=password)

    # Tạo Obj 
    user = User(
        username=username,
        email=email,
        hashed_password=hashed_pwd
    )

    from app.repositories.user_repo.create_user import create_user_repo
    return create_user_repo(db=db, user=user)

    # db.add(user) # Thêm vào DB
    # db.commit()
    # db.refresh(user)

    # return user