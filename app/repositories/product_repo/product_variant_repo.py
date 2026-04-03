from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.product_variant import ProductVariant
from app.schemas.product.product_variant import ProductVariantCreate, ProductVariantUpdate

def create_product_variant_repo(db: Session, variant_in: ProductVariantCreate) -> ProductVariant:
    db_obj = ProductVariant(
        product_id=variant_in.product_id,
        sku=variant_in.sku,
        attributes=variant_in.attributes,
        price_override=variant_in.price_override,
        stock_quantity=variant_in.stock_quantity,
        is_active=variant_in.is_active
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_product_variant_by_id_repo(db: Session, variant_id: int) -> Optional[ProductVariant]:
    return db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()

def get_variants_by_product_id_repo(db: Session, product_id: int, active_only: bool = True) -> List[ProductVariant]:
    query = db.query(ProductVariant).filter(ProductVariant.product_id == product_id)
    if active_only:
        query = query.filter(ProductVariant.is_active == True)
    return query.all()

def update_product_variant_repo(db: Session, db_obj: ProductVariant, variant_in: ProductVariantUpdate) -> ProductVariant:
    update_data = variant_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_product_variant_repo(db: Session, db_obj: ProductVariant) -> None:
    db.delete(db_obj)
    db.commit()

def soft_delete_product_variant_repo(db: Session, db_obj: ProductVariant) -> ProductVariant:
    db_obj.is_active = False
    db.commit()
    db.refresh(db_obj)
    return db_obj
