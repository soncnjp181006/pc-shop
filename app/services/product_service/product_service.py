from sqlalchemy.orm import Session
from typing import List, Optional
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

def create_product_service(db: Session, product_in: ProductCreate) -> Product:
    return create_product_repo(db, product_in)

def get_product_by_id_service(db: Session, product_id: int) -> Optional[Product]:
    return get_product_by_id_repo(db, product_id)

def get_all_products_service(db: Session, active_only: bool = True, skip: int = 0, limit: int = 100) -> List[Product]:
    return get_all_products_repo(db, active_only, skip, limit)

def update_product_service(db: Session, product_id: int, product_in: ProductUpdate) -> Optional[Product]:
    db_obj = get_product_by_id_repo(db, product_id)
    if not db_obj:
        return None
    return update_product_repo(db, db_obj, product_in)

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
