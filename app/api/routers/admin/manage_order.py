from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.order import OrderOut, OrderUpdateStatus
from app.schemas.common import PaginatedResponse
from app.models.order import Order, OrderStatus
from app.dependencies.user.get_current_admin import get_current_admin
from app.models.user import User
from sqlalchemy import func

router = APIRouter()

@router.get("/orders", response_model=PaginatedResponse[OrderOut])
def list_orders_admin(
    page: int = 1,
    limit: int = 20,
    status: Optional[OrderStatus] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin lấy danh sách đơn hàng"""
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    
    total = query.count()
    pages = (total + limit - 1) // limit if limit else 1
    skip = (page - 1) * limit
    
    data = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    return PaginatedResponse[OrderOut](
        data=data,
        total=total,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order_admin(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin lấy chi tiết đơn hàng"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    return order

@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status_admin(
    order_id: int,
    body: OrderUpdateStatus,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin cập nhật trạng thái đơn hàng"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    
    order.status = body.status
    db.commit()
    db.refresh(order)
    return order

@router.get("/stats/overview")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Lấy thống kê tổng quan cho Dashboard"""
    from app.models.product import Product
    from app.models.category import Category
    from app.models.user import User as UserModel
    
    product_count = db.query(Product).count()
    category_count = db.query(Category).count()
    user_count = db.query(UserModel).count()
    order_count = db.query(Order).count()
    
    # Tính tổng doanh thu từ các đơn hàng đã hoàn thành
    revenue = db.query(func.sum(Order.total_amount)).filter(Order.status == OrderStatus.DELIVERED).scalar() or 0
    
    return {
        "products": product_count,
        "categories": category_count,
        "users": user_count,
        "orders": order_count,
        "revenue": revenue
    }
