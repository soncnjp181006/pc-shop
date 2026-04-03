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
    
    # Tính tổng số lượng đã đặt (trong giỏ hàng) của tất cả variants của sản phẩm này
    total_reserved = 0
    if product.variants:
        for variant in product.variants:
            total_reserved += get_total_quantity_in_carts_repo(db, variant.id)
    
    # available_stock của product = tổng stock - tổng reserved
    product.available_stock = max(0, product.stock_quantity - total_reserved)
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
    sort: Optional[str] = None
) -> Dict[str, Any]:
    skip = (page - 1) * limit
    data, total = get_all_products_repo(
        db, active_only, skip, limit, category_id, min_price, max_price, q, sort
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
