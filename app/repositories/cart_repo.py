from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.models.cart import Cart, CartItem
from app.models.product_variant import ProductVariant

def get_cart_by_user_id_repo(db: Session, user_id: int) -> Optional[Cart]:
    return db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.variant).joinedload(ProductVariant.product)
    ).filter(Cart.user_id == user_id).first()

def create_cart_repo(db: Session, user_id: int) -> Cart:
    db_obj = Cart(user_id=user_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_cart_item_repo(db: Session, cart_id: int, variant_id: int) -> Optional[CartItem]:
    return db.query(CartItem).options(
        joinedload(CartItem.variant).joinedload(ProductVariant.product)
    ).filter(
        CartItem.cart_id == cart_id,
        CartItem.variant_id == variant_id
    ).first()

def add_cart_item_repo(db: Session, cart_id: int, variant_id: int, quantity: int) -> CartItem:
    db_obj = CartItem(cart_id=cart_id, variant_id=variant_id, quantity=quantity)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    # Reload with relations
    return db.query(CartItem).options(
        joinedload(CartItem.variant).joinedload(ProductVariant.product)
    ).filter(CartItem.id == db_obj.id).first()

def update_cart_item_qty_repo(db: Session, cart_item: CartItem, quantity: int) -> CartItem:
    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)
    # Reload with relations
    return db.query(CartItem).options(
        joinedload(CartItem.variant).joinedload(ProductVariant.product)
    ).filter(CartItem.id == cart_item.id).first()

def get_cart_item_by_id_repo(db: Session, item_id: int) -> Optional[CartItem]:
    return db.query(CartItem).options(
        joinedload(CartItem.variant).joinedload(ProductVariant.product)
    ).filter(CartItem.id == item_id).first()

def delete_cart_item_repo(db: Session, cart_item: CartItem) -> None:
    db.delete(cart_item)
    db.commit()
