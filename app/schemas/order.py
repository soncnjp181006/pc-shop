from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.order import OrderStatus

class OrderItemBase(BaseModel):
    variant_id: int
    product_name: str
    sku: str
    price: float
    quantity: int
    attributes: Optional[dict] = None
    image_url: Optional[str] = None

class OrderItemOut(OrderItemBase):
    id: int
    order_id: int

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    full_name: str
    phone: str
    address: str
    note: Optional[str] = None
    payment_method: str = "cod"

class OrderCreate(OrderBase):
    pass

class OrderUpdateStatus(BaseModel):
    status: OrderStatus

class OrderOut(OrderBase):
    id: int
    user_id: int
    total_amount: float
    status: OrderStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True

class CheckoutRequest(BaseModel):
    full_name: str
    phone: str
    address: str
    note: Optional[str] = None
    payment_method: str = "cod"
    voucher_code: Optional[str] = None
    item_ids: List[int]
    item_quantities: dict[int, int]
    total_amount: float
