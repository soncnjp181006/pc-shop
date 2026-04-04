"""
Product Model
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(250), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    base_price = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500), nullable=True)  # Link ảnh sản phẩm (Drive, v.v.)
    brand = Column(String(100), nullable=True)
    status = Column(String(50), nullable=True)
    product_condition = Column(String(100), nullable=True) # Loại mặt hàng (Mới, Cũ...)
    origin = Column(String(100), nullable=True) # Xách tay/Chính hãng
    stock_quantity = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="products")
    seller = relationship("User", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")

    @property
    def category_name(self):
        return self.category.name if self.category else None

    @property
    def seller_name(self):
        return self.seller.username if self.seller else None

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, slug={self.slug})>"
