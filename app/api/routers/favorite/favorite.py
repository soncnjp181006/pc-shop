"""
Favorite Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.favorite import (
    FavoriteCreate,
    FavoriteResponse,
    FavoriteDetailResponse
)
from app.models.user import User
from app.dependencies.user.get_current_user import get_current_user
from app.repositories.favorite_repo import (
    get_favorites_by_user_id_repo,
    check_favorite_exists_repo,
    get_favorite_repo,
    create_favorite_repo,
    delete_favorite_repo,
    delete_favorite_by_product_repo,
    get_favorite_count_repo
)

router = APIRouter()


@router.get("/", response_model=List[FavoriteDetailResponse])
def get_user_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách yêu thích của người dùng hiện tại
    """
    favorites = get_favorites_by_user_id_repo(db, current_user.id)
    return favorites


@router.post("/", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_to_favorite(
    favorite_in: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Thêm sản phẩm vào yêu thích
    """
    try:
        favorite = create_favorite_repo(db, current_user.id, favorite_in.product_id)
        return favorite
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa sản phẩm khỏi yêu thích
    """
    favorite = get_favorites_by_user_id_repo(db, current_user.id)
    if not any(f.id == favorite_id for f in favorite):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )

    delete_favorite_repo(db, favorite_id)
    return {"message": "Favorite removed successfully"}


@router.delete("/product/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite_by_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa sản phẩm khỏi yêu thích theo product_id
    """
    deleted = delete_favorite_by_product_repo(db, current_user.id, product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not in favorites"
        )
    return {"message": "Product removed from favorites"}


@router.get("/check/{product_id}")
def check_if_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Kiểm tra xem sản phẩm có trong yêu thích không
    """
    is_favorite = check_favorite_exists_repo(db, current_user.id, product_id)
    return {"product_id": product_id, "is_favorite": is_favorite}


@router.get("/count/", response_model=dict)
def get_favorites_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy số lượng sản phẩm yêu thích
    """
    count = get_favorite_count_repo(db, current_user.id)
    return {"count": count}
