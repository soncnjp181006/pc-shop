"""
User Model 

Đại diện cho bảng user trong DB
"""

from app.db.base import Base # Base dùng để tạo Model
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)
from datetime import datetime
from sqlalchemy import func
import enum # enum.Enum -> Giá trị mặc định (Dùng trong phân quyền người dùng)

class UserRole(str, enum.Enum):
    """Phân quyền người dùng"""
    CUSTOMER='CUSTOMER'
    SELLER='SELLER'
    ADMIN='ADMIN'

class User(Base):
    '''User Model'''
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(200), unique=True, nullable=False)
    email = Column(String(200), nullable=False, unique=True, index=True)
    hashed_password = Column(String(200), nullable=False, unique=False)
    is_active = Column(Boolean, nullable=False, default=True)
    role = Column(String(20), nullable=False, default=UserRole.CUSTOMER.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"