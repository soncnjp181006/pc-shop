from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sku = Column(String(100), nullable=False, unique=True, index=True)
    attributes = Column(JSON, nullable=False)  # Example: {"size": "L", "color": "red"}
    price_override = Column(Float, nullable=True)  # Override product base price if set
    stock_quantity = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="variants")

    def __repr__(self):
        return f"<ProductVariant(id={self.id}, sku={self.sku}, product_id={self.product_id})>"
