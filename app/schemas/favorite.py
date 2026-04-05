"""
Schemas for Favorite (Wishlist)
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FavoriteCreate(BaseModel):
    """Schema khi thêm sản phẩm vào yêu thích"""
    product_id: int


class FavoriteResponse(BaseModel):
    """Schema phản hồi yêu thích"""
    id: int
    user_id: int
    product_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteProductResponse(BaseModel):
    """Schema hiển thị sản phẩm yêu thích"""
    id: int
    name: str
    slug: str
    base_price: float
    image_url: Optional[str] = None
    brand: Optional[str] = None
    stock_quantity: int
    is_active: bool

    class Config:
        from_attributes = True


class FavoriteDetailResponse(BaseModel):
    """Schema chi tiết yêu thích"""
    id: int
    user_id: int
    product_id: int
    product: FavoriteProductResponse
    created_at: datetime

    class Config:
        from_attributes = True
