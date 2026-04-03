from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.category import Category
from app.schemas.category.category import CategoryCreate, CategoryUpdate

def create_category_repo(db: Session, category_in: CategoryCreate) -> Category:
    db_obj = Category(
        name=category_in.name,
        slug=category_in.slug,
        parent_id=category_in.parent_id,
        is_active=category_in.is_active
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_category_by_id_repo(db: Session, category_id: int) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()

def get_all_categories_repo(db: Session, active_only: bool = True) -> List[Category]:
    query = db.query(Category)
    if active_only:
        query = query.filter(Category.is_active == True)
    return query.all()

def update_category_repo(db: Session, db_obj: Category, category_in: CategoryUpdate) -> Category:
    update_data = category_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def soft_delete_category_repo(db: Session, db_obj: Category) -> Category:
    db_obj.is_active = False
    db.commit()
    db.refresh(db_obj)
    return db_obj
