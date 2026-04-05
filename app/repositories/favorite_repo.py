"""
Repository for Favorite (Wishlist)
"""

from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.favorite import Favorite
from app.models.product import Product


def get_favorite_by_id_repo(db: Session, favorite_id: int) -> Optional[Favorite]:
    """Lấy yêu thích theo ID"""
    return db.query(Favorite).options(
        joinedload(Favorite.product)
    ).filter(Favorite.id == favorite_id).first()


def get_favorites_by_user_id_repo(db: Session, user_id: int) -> List[Favorite]:
    """Lấy tất cả yêu thích của người dùng"""
    return db.query(Favorite).options(
        joinedload(Favorite.product)
    ).filter(Favorite.user_id == user_id).order_by(Favorite.created_at.desc()).all()


def check_favorite_exists_repo(db: Session, user_id: int, product_id: int) -> bool:
    """Kiểm tra sản phẩm đã được yêu thích chưa"""
    return db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.product_id == product_id
    ).first() is not None


def get_favorite_repo(db: Session, user_id: int, product_id: int) -> Optional[Favorite]:
    """Lấy yêu thích theo user_id và product_id"""
    return db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.product_id == product_id
    ).first()


def create_favorite_repo(db: Session, user_id: int, product_id: int) -> Favorite:
    """Thêm sản phẩm vào yêu thích"""
    # Kiểm tra xem sản phẩm có tồn tại không
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product with id {product_id} not found")

    # Kiểm tra xem đã yêu thích chưa
    existing = get_favorite_repo(db, user_id, product_id)
    if existing:
        raise ValueError("Product already in favorites")

    db_obj = Favorite(user_id=user_id, product_id=product_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db.query(Favorite).options(
        joinedload(Favorite.product)
    ).filter(Favorite.id == db_obj.id).first()


def delete_favorite_repo(db: Session, favorite_id: int) -> bool:
    """Xóa yêu thích"""
    db_obj = db.query(Favorite).filter(Favorite.id == favorite_id).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True


def delete_favorite_by_product_repo(db: Session, user_id: int, product_id: int) -> bool:
    """Xóa yêu thích theo product_id"""
    db_obj = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.product_id == product_id
    ).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True


def get_favorite_count_repo(db: Session, user_id: int) -> int:
    """Đếm số sản phẩm yêu thích"""
    return db.query(Favorite).filter(Favorite.user_id == user_id).count()
