from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Tuple
from app.models.product import Product
from app.schemas.product.product import ProductCreate, ProductUpdate

def create_product_repo(db: Session, product_in: ProductCreate) -> Product:
    db_obj = Product(
        name=product_in.name,
        slug=product_in.slug,
        description=product_in.description,
        base_price=product_in.base_price,
        category_id=product_in.category_id,
        seller_id=product_in.seller_id,
        image_url=product_in.image_url,
        is_active=product_in.is_active
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_product_by_id_repo(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()

def get_all_products_repo(
    db: Session, 
    active_only: bool = True, 
    skip: int = 0, 
    limit: int = 100,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    q: Optional[str] = None,
    sort: Optional[str] = None
) -> Tuple[List[Product], int]:
    query = db.query(Product)
    
    # Filter by activity
    if active_only:
        query = query.filter(Product.is_active == True)
    
    # Filter by category
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    # Filter by price range
    if min_price is not None:
        query = query.filter(Product.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.base_price <= max_price)
    
    # Search by name
    if q:
        query = query.filter(Product.name.ilike(f"%{q}%"))
    
    # Sorting
    if sort == "price_asc":
        query = query.order_by(Product.base_price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.base_price.desc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        # Default sort
        query = query.order_by(Product.id.desc())

    total = query.count()
    data = query.offset(skip).limit(limit).all()
    
    return data, total

def update_product_repo(db: Session, db_obj: Product, product_in: ProductUpdate) -> Product:
    update_data = product_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_product_repo(db: Session, db_obj: Product) -> None:
    db.delete(db_obj)
    db.commit()

def soft_delete_product_repo(db: Session, db_obj: Product) -> Product:
    db_obj.is_active = False
    db.commit()
    db.refresh(db_obj)
    return db_obj
