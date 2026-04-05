import sys
import os
from sqlalchemy.orm import Session

# Thêm thư mục hiện tại vào sys.path để import được app
sys.path.append(os.getcwd())

from app.db.session import engine
from app.models.user import User, UserRole
from sqlalchemy.orm import sessionmaker

def set_admin(email: str):
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Lỗi: Không tìm thấy user với email: {email}")
            return
        
        user.role = UserRole.ADMIN.value
        db.commit()
        print(f"Thành công: Đã cấp quyền ADMIN cho user: {user.username} ({email})")
        
    except Exception as e:
        print(f" Lỗi: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Sử dụng: python set_admin.py <email>")
    else:
        email = sys.argv[1]
        set_admin(email)
