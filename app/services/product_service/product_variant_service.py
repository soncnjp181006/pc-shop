from sqlalchemy.orm import Session
from typing import List, Optional, Any
from app.models.product_variant import ProductVariant
from app.schemas.product.product_variant import ProductVariantCreate, ProductVariantUpdate
from app.repositories.product_repo.product_variant_repo import (
    create_product_variant_repo,
    get_product_variant_by_id_repo,
    get_variants_by_product_id_repo,
    update_product_variant_repo,
    delete_product_variant_repo,
    soft_delete_product_variant_repo
)
from app.repositories.cart_repo import get_total_quantity_in_carts_repo

def _inject_available_stock(db: Session, variant: ProductVariant) -> Any:
    if not variant:
        return None
    
    # Refresh to ensure we have the latest stock_quantity from DB
    db.refresh(variant)
    
    # Tính tổng số lượng trong giỏ hàng
    reserved_qty = get_total_quantity_in_carts_repo(db, variant.id)
    
    # Gán vào thuộc tính ảo (vì schema có field này)
    variant.available_stock = max(0, variant.stock_quantity - reserved_qty)
    return variant

def create_product_variant_service(db: Session, variant_in: ProductVariantCreate) -> ProductVariant:
    variant = create_product_variant_repo(db, variant_in)
    return _inject_available_stock(db, variant)

def get_product_variant_by_id_service(db: Session, variant_id: int) -> Optional[ProductVariant]:
    variant = get_product_variant_by_id_repo(db, variant_id)
    return _inject_available_stock(db, variant)

def get_variants_by_product_id_service(db: Session, product_id: int, active_only: bool = True) -> List[ProductVariant]:
    variants = get_variants_by_product_id_repo(db, product_id, active_only)
    for v in variants:
        _inject_available_stock(db, v)
    return variants

def update_product_variant_service(db: Session, variant_id: int, variant_in: ProductVariantUpdate) -> Optional[ProductVariant]:
    db_obj = get_product_variant_by_id_repo(db, variant_id)
    if not db_obj:
        return None
    updated_variant = update_product_variant_repo(db, db_obj, variant_in)
    return _inject_available_stock(db, updated_variant)

def delete_product_variant_service(db: Session, variant_id: int) -> bool:
    db_obj = get_product_variant_by_id_repo(db, variant_id)
    if not db_obj:
        return False
    delete_product_variant_repo(db, db_obj)
    return True

def soft_delete_product_variant_service(db: Session, variant_id: int) -> Optional[ProductVariant]:
    db_obj = get_product_variant_by_id_repo(db, variant_id)
    if not db_obj:
        return None
    return soft_delete_product_variant_repo(db, db_obj)
