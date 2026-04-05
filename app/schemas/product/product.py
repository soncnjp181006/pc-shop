from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.common import PaginatedResponse

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=250)
    description: Optional[str] = None
    base_price: float = Field(..., gt=0)
    category_id: int
    seller_id: int
    image_url: Optional[str] = None
    brand: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    product_condition: Optional[str] = Field(None, max_length=100)
    origin: Optional[str] = Field(None, max_length=100)
    stock_quantity: Optional[int] = Field(0, ge=0)
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=250)
    description: Optional[str] = None
    base_price: Optional[float] = Field(None, gt=0)
    category_id: Optional[int] = None
    seller_id: Optional[int] = None
    image_url: Optional[str] = None
    brand: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    product_condition: Optional[str] = Field(None, max_length=100)
    origin: Optional[str] = Field(None, max_length=100)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class ProductOut(ProductBase):
    id: int
    category_name: Optional[str] = None
    seller_name: Optional[str] = None
    available_stock: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    sold_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class ProductSimple(BaseModel):
    id: int
    name: str
    image_url: Optional[str] = None
    base_price: float
    stock_quantity: Optional[int] = 0
    available_stock: int = 0

    model_config = ConfigDict(from_attributes=True)
