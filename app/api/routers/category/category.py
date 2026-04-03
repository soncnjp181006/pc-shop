from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.category.category import CategoryCreate, CategoryUpdate, CategoryOut, CategoryTreeOut
from app.services.category_service.category_service import (
    create_category_service,
    get_category_by_id_service,
    get_all_categories_service,
    update_category_service,
    delete_category_service,
    get_category_tree_service
)
from app.dependencies.user.get_current_admin import get_current_admin
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Tạo Category mới (Chỉ dành cho ADMIN)
    """
    # Kiểm tra parent_id có tồn tại không nếu có
    if category_in.parent_id:
        parent = get_category_by_id_service(db, category_in.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent category not found"
            )
            
    return create_category_service(db, category_in)

@router.get("/", response_model=List[CategoryOut])
def get_categories(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách phẳng tất cả Category
    """
    return get_all_categories_service(db, active_only)

@router.get("/tree", response_model=List[CategoryTreeOut])
def get_category_tree(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách Category dưới dạng cây thư mục (Nested JSON)
    """
    return get_category_tree_service(db, active_only)

@router.get("/{id}", response_model=CategoryOut)
def get_category_by_id(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết Category theo ID
    """
    category = get_category_by_id_service(db, id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

@router.put("/{id}", response_model=CategoryOut)
def update_category(
    id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Cập nhật Category (Chỉ dành cho ADMIN)
    """
    # Kiểm tra parent_id có tồn tại không nếu có cập nhật
    if category_in.parent_id:
        parent = get_category_by_id_service(db, category_in.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent category not found"
            )
            
    updated_cat = update_category_service(db, id, category_in)
    if not updated_cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return updated_cat

@router.delete("/{id}", response_model=CategoryOut)
def delete_category(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """
    Xóa Category (Soft Delete - Chuyển is_active thành False) (Chỉ dành cho ADMIN)
    """
    deleted_cat = delete_category_service(db, id)
    if not deleted_cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return deleted_cat
