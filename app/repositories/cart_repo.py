from sqlalchemy.orm import Session
from typing import Optional
from app.models.cart import Cart, CartItem

def get_cart_by_user_id_repo(db: Session, user_id: int) -> Optional[Cart]:
    return db.query(Cart).filter(Cart.user_id == user_id).first()

def create_cart_repo(db: Session, user_id: int) -> Cart:
    db_obj = Cart(user_id=user_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_cart_item_repo(db: Session, cart_id: int, variant_id: int) -> Optional[CartItem]:
    return db.query(CartItem).filter(
        CartItem.cart_id == cart_id,
        CartItem.variant_id == variant_id
    ).first()

def add_cart_item_repo(db: Session, cart_id: int, variant_id: int, quantity: int) -> CartItem:
    db_obj = CartItem(cart_id=cart_id, variant_id=variant_id, quantity=quantity)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_cart_item_qty_repo(db: Session, cart_item: CartItem, quantity: int) -> CartItem:
    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item

def get_cart_item_by_id_repo(db: Session, item_id: int) -> Optional[CartItem]:
    return db.query(CartItem).filter(CartItem.id == item_id).first()

def delete_cart_item_repo(db: Session, cart_item: CartItem) -> None:
    db.delete(cart_item)
    db.commit()
