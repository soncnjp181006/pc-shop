from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.schemas.product.product import ProductOut, PaginatedResponse, ProductUpdate
from app.services.product_service.product_service import (
    get_all_products_service,
    update_product_service,
    get_product_by_id_service
)
from app.dependencies.user.get_current_admin import get_current_admin
from app.models.user import User

from app.services.cart_service import notify_stock_change
import asyncio

router = APIRouter()

class ProductStatusUpdate(BaseModel):
    is_active: Optional[bool] = None
    stock_quantity: Optional[int] = None

@router.get("/products", response_model=PaginatedResponse[ProductOut])
def list_products_admin(
    page: int = 1,
    limit: int = 20,
    q: Optional[str] = None,
    sort: Optional[str] = None,
    active_only: Optional[bool] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin lấy danh sách tất cả sản phẩm (bao gồm cả ẩn)"""
    active_flag = False if active_only is None else active_only
    return get_all_products_service(
        db, active_only=active_flag, page=page, limit=limit, q=q, 
        category_id=category_id, sort=sort, brand=brand, in_stock=in_stock
    )

@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product_admin(
    product_id: int,
    data: ProductStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin cập nhật trạng thái hoặc số lượng tồn kho sản phẩm"""
    product = get_product_by_id_service(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sản phẩm không tồn tại"
        )
    
    update_data = ProductUpdate(**data.model_dump(exclude_unset=True))
    updated_product = update_product_service(db, product_id, update_data)
    
    # Broadcast thay đổi kho khi admin cập nhật số lượng
    if data.stock_quantity is not None:
        await notify_stock_change(db, product_id)
        
    return updated_product
