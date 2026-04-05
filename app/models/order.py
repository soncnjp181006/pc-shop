from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class OrderStatus(str, enum.Enum):
    PENDING = "pending"       # Chờ xác nhận
    CONFIRMED = "confirmed"   # Đã xác nhận
    PROCESSING = "processing" # Đang xử lý/Đóng gói
    SHIPPING = "shipping"     # Đang giao hàng
    DELIVERED = "delivered"   # Đã giao hàng
    CANCELLED = "cancelled"   # Đã hủy
    RETURNED = "returned"     # Trả hàng

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Thông tin người nhận (Lưu snapshot để tránh bị đổi sau này)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    note = Column(Text, nullable=True)
    
    # Thông tin thanh toán
    payment_method = Column(String(50), default="cod") # cod, vnpay, momo, etc.
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    
    # Snapshot thông tin tại thời điểm mua
    product_name = Column(String(250), nullable=False)
    sku = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    attributes = Column(JSON, nullable=True)
    image_url = Column(String(500), nullable=True)

    # Relationships
    order = relationship("Order", back_populates="items")
    variant = relationship("ProductVariant")
