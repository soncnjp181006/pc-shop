from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.schemas.product.product_variant import ProductVariantOut

class CartItemBase(BaseModel):
    variant_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: int = Field(..., gt=0)

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

class CartItemOut(CartItemBase):
    id: int
    cart_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    variant: ProductVariantOut
    price: float = 0.0
    subtotal: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class CartOut(BaseModel):
    id: int
    user_id: int
    items: List[CartItemOut]
    total_price: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
