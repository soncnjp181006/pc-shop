"""
Favorite (Wishlist) Model
"""

from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="favorites")
    product = relationship("Product", back_populates="favorites")

    # Constraint để tránh trùng lặp
    __table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_user_product_favorite"),)

    def __repr__(self):
        return f"<Favorite(user_id={self.user_id}, product_id={self.product_id})>"
