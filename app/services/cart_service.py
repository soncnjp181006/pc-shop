from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.models.cart import Cart, CartItem
from app.repositories.cart_repo import (
    get_cart_by_user_id_repo,
    create_cart_repo,
    get_cart_item_repo,
    add_cart_item_repo,
    update_cart_item_qty_repo,
    get_cart_item_by_id_repo,
    delete_cart_item_repo
)
from app.repositories.product_repo.product_variant_repo import get_product_variant_by_id_repo

def get_or_create_cart_service(db: Session, user_id: int) -> Cart:
    cart = get_cart_by_user_id_repo(db, user_id)
    if not cart:
        cart = create_cart_repo(db, user_id)
    return cart

def get_cart_details_service(db: Session, user_id: int) -> Dict[str, Any]:
    cart = get_or_create_cart_service(db, user_id)
    
    total_price = 0.0
    for item in cart.items:
        # Lấy giá của variant (nếu có override, dùng price_override, ngược lại dùng base_price của product)
        variant = item.variant
        price = variant.price_override if variant.price_override else variant.product.base_price
        total_price += price * item.quantity
    
    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": cart.items,
        "total_price": total_price,
        "created_at": cart.created_at,
        "updated_at": cart.updated_at
    }

def add_item_to_cart_service(db: Session, user_id: int, variant_id: int, quantity: int) -> CartItem:
    cart = get_or_create_cart_service(db, user_id)
    
    # Kiểm tra variant có tồn tại không
    variant = get_product_variant_by_id_repo(db, variant_id)
    if not variant:
        return None

    # Kiểm tra xem item đã có trong cart chưa
    existing_item = get_cart_item_repo(db, cart.id, variant_id)
    if existing_item:
        new_qty = existing_item.quantity + quantity
        return update_cart_item_qty_repo(db, existing_item, new_qty)
    else:
        return add_cart_item_repo(db, cart.id, variant_id, quantity)

def update_cart_item_qty_service(db: Session, user_id: int, item_id: int, quantity: int) -> Optional[CartItem]:
    item = get_cart_item_by_id_repo(db, item_id)
    if not item or item.cart.user_id != user_id:
        return None
    
    return update_cart_item_qty_repo(db, item, quantity)

def delete_cart_item_service(db: Session, user_id: int, item_id: int) -> bool:
    item = get_cart_item_by_id_repo(db, item_id)
    if not item or item.cart.user_id != user_id:
        return False
    
    delete_cart_item_repo(db, item)
    return True
