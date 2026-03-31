from app.core.config import settings    # import settings = class Settings
from sqlalchemy import create_engine    # Tạo kết nối database
from sqlalchemy.orm import sessionmaker # Tạo session thực hiện cho truy vấn

# Tạo kết nối database
engine = create_engine(
    settings.DATABASE_URL, 
    echo=settings.DEBUG,
    pool_pre_ping=True,   # kiểm tra connection trước khi dùng (tránh connection chết)
    pool_recycle=3600,    # Recycle connection sau 1 tiếng để tránh timeout
    pool_size=15,         # Số kết nối tối đa trong pool
    max_overflow=15,      # Số kết nối mở thêm khi pool tràn
)

# Tạo session để thực hiện các query
SessionLocal = sessionmaker(
    autocommit=False,     # Không tự động commit
    autoflush=False,      # Không tự động flush
    bind=engine           # Gắn với engine
)

def get_db():
    """
    Dependency cho FastAPI

    Mỗi request:
        - tạo 1 session riêng
        - dùng xong thì đóng lại
    """
    db = SessionLocal()

    try:
        yield db
    except Exception:
        db.rollback() # Quay lại trạng thái trước khi có thay đổi
        raise         # Ném ra lỗi 
    finally:
        db.close()    