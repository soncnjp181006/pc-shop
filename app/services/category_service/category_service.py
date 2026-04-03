from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from app.models.category import Category
from app.schemas.category.category import CategoryCreate, CategoryUpdate, CategoryTreeOut
from app.repositories.category_repo.category_repo import (
    create_category_repo,
    get_category_by_id_repo,
    get_all_categories_repo,
    update_category_repo,
    soft_delete_category_repo
)

def create_category_service(db: Session, category_in: CategoryCreate) -> Category:
    return create_category_repo(db, category_in)

def get_category_by_id_service(db: Session, category_id: int) -> Optional[Category]:
    return get_category_by_id_repo(db, category_id)

def get_all_categories_service(db: Session, active_only: bool = True) -> List[Category]:
    return get_all_categories_repo(db, active_only)

def update_category_service(db: Session, category_id: int, category_in: CategoryUpdate) -> Optional[Category]:
    db_obj = get_category_by_id_repo(db, category_id)
    if not db_obj:
        return None
    return update_category_repo(db, db_obj, category_in)

def delete_category_service(db: Session, category_id: int) -> Optional[Category]:
    db_obj = get_category_by_id_repo(db, category_id)
    if not db_obj:
        return None
    return soft_delete_category_repo(db, db_obj)

def get_category_tree_service(db: Session, active_only: bool = True) -> List[CategoryTreeOut]:
    """
    Xây dựng cây thư mục từ danh sách phẳng các category.
    """
    categories = get_all_categories_repo(db, active_only)
    
    # Tạo map từ id sang category object
    category_map: Dict[int, CategoryTreeOut] = {}
    for cat in categories:
        # Quan trọng: tạo object Pydantic mới, đảm bảo children là list rỗng
        node = CategoryTreeOut.model_validate(cat)
        node.children = [] 
        category_map[cat.id] = node
    
    roots: List[CategoryTreeOut] = []
    
    for cat_id, cat_tree in category_map.items():
        if cat_tree.parent_id is None:
            roots.append(cat_tree)
        else:
            parent = category_map.get(cat_tree.parent_id)
            if parent:
                parent.children.append(cat_tree)
            # Không append vào roots nếu không tìm thấy cha (vì active_only)
                
    return roots
