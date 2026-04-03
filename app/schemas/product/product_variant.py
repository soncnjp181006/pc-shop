from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from app.schemas.product.product import ProductSimple

class ProductVariantBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100)
    attributes: Dict[str, Any] = Field(..., description="Example: {'size': 'L', 'color': 'red'}")
    price_override: Optional[float] = Field(None, gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    is_active: bool = True

class ProductVariantCreate(ProductVariantBase):
    product_id: int

class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    attributes: Optional[Dict[str, Any]] = None
    price_override: Optional[float] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class ProductVariantOut(ProductVariantBase):
    id: int
    product_id: int
    available_stock: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    product: Optional[ProductSimple] = None

    model_config = ConfigDict(from_attributes=True)
