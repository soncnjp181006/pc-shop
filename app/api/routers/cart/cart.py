from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemOut, CartOut
from app.services.cart_service import (
    get_cart_details_service,
    add_item_to_cart_service,
    update_cart_item_qty_service,
    delete_cart_item_service
)
from app.dependencies.user.get_current_user import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=CartOut)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin giỏ hàng của người dùng hiện tại
    """
    return get_cart_details_service(db, current_user.id)

@router.post("/items", response_model=CartItemOut, status_code=status.HTTP_201_CREATED)
def add_item_to_cart(
    item_in: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Thêm sản phẩm vào giỏ hàng
    """
    item = add_item_to_cart_service(db, current_user.id, item_in.variant_id, item_in.quantity, item_in.product_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product or variant not found"
        )
    return item

@router.put("/items/{item_id}", response_model=CartItemOut)
def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật số lượng sản phẩm trong giỏ hàng
    """
    updated_item = update_cart_item_qty_service(db, current_user.id, item_id, item_in.quantity)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    return updated_item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa sản phẩm khỏi giỏ hàng
    """
    success = delete_cart_item_service(db, current_user.id, item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )
    return None
