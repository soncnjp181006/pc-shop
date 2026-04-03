import sys
import os

# Thêm thư mục hiện tại vào sys.path để import được app
sys.path.append(os.getcwd())

from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.category import Category

def create_tables():
    print("🚀 Đang khởi tạo database...")
    try:
        # Tạo tất cả các bảng dựa trên các model đã được import
        Base.metadata.create_all(bind=engine)
        print("✅ Thành công: Đã tạo các bảng trong database.")
    except Exception as e:
        print(f"❌ Lỗi khi tạo bảng: {e}")

if __name__ == "__main__":
    create_tables()
