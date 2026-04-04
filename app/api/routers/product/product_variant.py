from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.product.product_variant import ProductVariantCreate, ProductVariantUpdate, ProductVariantOut
from app.services.product_service.product_variant_service import (
    create_product_variant_service,
    get_product_variant_by_id_service,
    get_variants_by_product_id_service,
    update_product_variant_service,
    delete_product_variant_service
)
from app.services.product_service.product_service import get_product_by_id_service
from app.dependencies.user.get_current_user import get_current_user
from app.models.user import User

from app.services.cart_service import notify_stock_change
import asyncio

router = APIRouter()

@router.post("/{product_id}/variants/", response_model=ProductVariantOut, status_code=status.HTTP_201_CREATED)
async def create_variant(
    product_id: int,
    variant_in: ProductVariantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo Variant mới cho Product
    """
    # Ensure product_id in variant_in matches product_id in path
    if variant_in.product_id != product_id:
        variant_in.product_id = product_id

    product = get_product_by_id_service(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    new_variant = create_product_variant_service(db, variant_in)
    await notify_stock_change(db, product_id)
    return new_variant

@router.get("/{product_id}/variants/", response_model=List[ProductVariantOut])
def get_variants(
    product_id: int,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách Variant của một Product
    """
    product = get_product_by_id_service(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return get_variants_by_product_id_service(db, product_id, active_only)

@router.get("/variants/{variant_id}", response_model=ProductVariantOut)
def get_variant_by_id(
    variant_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết Variant theo ID
    """
    variant = get_product_variant_by_id_service(db, variant_id)
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
    return variant

@router.put("/variants/{variant_id}", response_model=ProductVariantOut)
async def update_variant(
    variant_id: int,
    variant_in: ProductVariantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật Variant
    """
    updated_variant = update_product_variant_service(db, variant_id, variant_in)
    if not updated_variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
    
    await notify_stock_change(db, updated_variant.product_id)
    return updated_variant

@router.delete("/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variant(
    variant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa Variant
    """
    variant = get_product_variant_by_id_service(db, variant_id)
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
    
    product_id = variant.product_id
    success = delete_product_variant_service(db, variant_id)
    if success:
        await notify_stock_change(db, product_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant not found"
        )
    return None
