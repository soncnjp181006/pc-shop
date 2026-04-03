from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.schemas.product.product import ProductCreate, ProductUpdate, ProductOut, PaginatedResponse
from app.services.product_service.product_service import (
    create_product_service,
    get_product_by_id_service,
    get_all_products_service,
    update_product_service,
    delete_product_service,
    soft_delete_product_service
)
from app.services.category_service.category_service import get_category_by_id_service
from app.services.user_service.user_id import get_user_by_id
from app.dependencies.user.get_current_user import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo Product mới
    """
    # Kiểm tra category có tồn tại không
    category = get_category_by_id_service(db, product_in.category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Kiểm tra seller có tồn tại không
    seller = get_user_by_id(db, product_in.seller_id)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )
            
    return create_product_service(db, product_in)

@router.get("/", response_model=PaginatedResponse[ProductOut])
def get_products(
    active_only: bool = True,
    page: int = 1,
    limit: int = 20,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    q: Optional[str] = None,
    sort: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách Product với phân trang, lọc và tìm kiếm
    """
    return get_all_products_service(
        db, active_only, page, limit, category_id, min_price, max_price, q, sort
    )

@router.get("/{id}", response_model=ProductOut)
def get_product_by_id(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết Product theo ID
    """
    product = get_product_by_id_service(db, id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.put("/{id}", response_model=ProductOut)
def update_product(
    id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật Product
    """
    # Kiểm tra category có tồn tại không nếu có cập nhật
    if product_in.category_id:
        category = get_category_by_id_service(db, product_in.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
            
    # Kiểm tra seller có tồn tại không nếu có cập nhật
    if product_in.seller_id:
        seller = get_user_by_id(db, product_in.seller_id)
        if not seller:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller not found"
            )

    updated_product = update_product_service(db, id, product_in)
    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return updated_product

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa Product (Hard delete)
    """
    success = delete_product_service(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return None

@router.patch("/{id}/soft-delete", response_model=ProductOut)
def soft_delete_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa mềm Product (is_active = False)
    """
    product = soft_delete_product_service(db, id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product
