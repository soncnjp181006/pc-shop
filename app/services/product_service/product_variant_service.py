from sqlalchemy.orm import Session
from typing import List, Optional
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

def create_product_variant_service(db: Session, variant_in: ProductVariantCreate) -> ProductVariant:
    return create_product_variant_repo(db, variant_in)

def get_product_variant_by_id_service(db: Session, variant_id: int) -> Optional[ProductVariant]:
    return get_product_variant_by_id_repo(db, variant_id)

def get_variants_by_product_id_service(db: Session, product_id: int, active_only: bool = True) -> List[ProductVariant]:
    return get_variants_by_product_id_repo(db, product_id, active_only)

def update_product_variant_service(db: Session, variant_id: int, variant_in: ProductVariantUpdate) -> Optional[ProductVariant]:
    db_obj = get_product_variant_by_id_repo(db, variant_id)
    if not db_obj:
        return None
    return update_product_variant_repo(db, db_obj, variant_in)

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
