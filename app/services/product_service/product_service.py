from sqlalchemy.orm import Session
from typing import List, Optional, Tuple, Dict, Any
from app.models.product import Product
from app.schemas.product.product import ProductCreate, ProductUpdate
from app.repositories.product_repo.product_repo import (
    create_product_repo,
    get_product_by_id_repo,
    get_all_products_repo,
    update_product_repo,
    delete_product_repo,
    soft_delete_product_repo
)
from app.repositories.cart_repo import get_total_quantity_in_carts_repo

def _inject_product_available_stock(db: Session, product: Product) -> Product:
    if not product:
        return None
    
    # Refresh to ensure we have the latest stock_quantity from DB
    db.refresh(product)
    
    # Tính tổng số lượng đã đặt (trong giỏ hàng) của tất cả variants của sản phẩm này
    total_reserved = 0
    from app.models.cart import CartItem
    from app.models.product_variant import ProductVariant
    from app.models.order import OrderItem, Order, OrderStatus
    from sqlalchemy import func
    
    total_in_cart = db.query(func.sum(CartItem.quantity))\
        .join(ProductVariant, CartItem.variant_id == ProductVariant.id)\
        .filter(ProductVariant.product_id == product.id)\
        .scalar() or 0
        
    total_sold = db.query(func.sum(OrderItem.quantity))\
        .join(ProductVariant, OrderItem.variant_id == ProductVariant.id)\
        .join(Order, OrderItem.order_id == Order.id)\
        .filter(ProductVariant.product_id == product.id)\
        .filter(Order.status != OrderStatus.CANCELLED)\
        .filter(Order.status != OrderStatus.RETURNED)\
        .scalar() or 0

    # available_stock (Còn lại, có thể bán tiếp) = Số lượng trong kho (chưa bán) - số đang kẹt trong giỏ hàng
    product.available_stock = max(0, product.stock_quantity - int(total_in_cart))
    
    # chưa bán (Unsold) = chính là số lượng trong kho DB hiện tại
    setattr(product, "unsold_stock", product.stock_quantity)

    # đã bán = tổng đơn hàng thành công
    setattr(product, "sold_count", int(total_sold))
    return product

def create_product_service(db: Session, product_in: ProductCreate) -> Product:
    product = create_product_repo(db, product_in)
    return _inject_product_available_stock(db, product)

def get_product_by_id_service(db: Session, product_id: int) -> Optional[Product]:
    product = get_product_by_id_repo(db, product_id)
    return _inject_product_available_stock(db, product)

def get_all_products_service(
    db: Session, 
    active_only: bool = True, 
    page: int = 1, 
    limit: int = 100,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    q: Optional[str] = None,
    sort: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    product_condition: Optional[str] = None,
    origin: Optional[str] = None
) -> Dict[str, Any]:
    skip = (page - 1) * limit
    data, total = get_all_products_repo(
        db, active_only, skip, limit, category_id, min_price, max_price, q, sort, brand, in_stock,
        product_condition=product_condition,
        origin=origin
    )
    
    # Inject available stock cho từng sản phẩm
    for product in data:
        _inject_product_available_stock(db, product)
        
    pages = (total + limit - 1) // limit
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

def update_product_service(db: Session, product_id: int, product_in: ProductUpdate) -> Optional[Product]:
    db_obj = get_product_by_id_repo(db, product_id)
    if not db_obj:
        return None
    updated_product = update_product_repo(db, db_obj, product_in)
    return _inject_product_available_stock(db, updated_product)

def delete_product_service(db: Session, product_id: int) -> bool:
    db_obj = get_product_by_id_repo(db, product_id)
    if not db_obj:
        return False
    delete_product_repo(db, db_obj)
    return True

def soft_delete_product_service(db: Session, product_id: int) -> Optional[Product]:
    db_obj = get_product_by_id_repo(db, product_id)
    if not db_obj:
        return None
    return soft_delete_product_repo(db, db_obj)
