from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, Dict
from app.db.session import get_db
from app.schemas.product.product import ProductOut, PaginatedResponse, ProductUpdate
from app.services.product_service.product_service import (
    get_all_products_service,
    update_product_service,
    get_product_by_id_service
)
from app.dependencies.user.get_current_admin import get_current_admin
from app.models.user import User

from app.services.cart_service import notify_stock_change
import asyncio

router = APIRouter()

DEFAULT_PRODUCT_META_CONFIG: Dict[str, str] = {
    "brands": "Apple\nASUS\nMSI\nGigabyte\nDell\nHP\nLenovo\nRazer\nCorsair\nNZXT\nLogitech\nSamsung\nLG\nIntel\nAMD\nNVIDIA",
    "statuses": "Đang kinh doanh\nNgừng kinh doanh\nSắp về hàng\nLiên hệ",
    "conditions": "Mới 100% Fullbox\nHàng Like New 99%\nHàng Cũ 95%\nHàng Cũ 90%\nHàng Trôi bảo hành",
    "origins": "Chính hãng (VAT)\nXách tay (Global)\nHàng nhập khẩu",
}

class ProductMetaConfigIn(BaseModel):
    brands: str
    statuses: str
    conditions: str
    origins: str

class ProductStatusUpdate(BaseModel):
    is_active: Optional[bool] = None
    stock_quantity: Optional[int] = None


def _ensure_app_config_table(db: Session) -> None:
    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS app_config (
              `key` VARCHAR(100) PRIMARY KEY,
              `value` LONGTEXT NOT NULL,
              `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """
        )
    )
    db.commit()


def _get_app_config_value(db: Session, key: str) -> Optional[str]:
    _ensure_app_config_table(db)
    row = db.execute(text("SELECT `value` FROM app_config WHERE `key`=:k LIMIT 1"), {"k": key}).fetchone()
    if not row:
        return None
    return row[0]


def _set_app_config_value(db: Session, key: str, value: str) -> None:
    _ensure_app_config_table(db)
    db.execute(
        text(
            """
            INSERT INTO app_config (`key`, `value`)
            VALUES (:k, :v)
            ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)
            """
        ),
        {"k": key, "v": value},
    )
    db.commit()

@router.get("/products", response_model=PaginatedResponse[ProductOut])
def list_products_admin(
    page: int = 1,
    limit: int = 20,
    q: Optional[str] = None,
    sort: Optional[str] = None,
    active_only: Optional[bool] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    category_id: Optional[int] = None,
    product_condition: Optional[str] = None,
    origin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin lấy danh sách tất cả sản phẩm (bao gồm cả ẩn)"""
    active_flag = False if active_only is None else active_only
    return get_all_products_service(
        db, active_only=active_flag, page=page, limit=limit, q=q, 
        category_id=category_id, sort=sort, brand=brand, in_stock=in_stock,
        product_condition=product_condition,
        origin=origin
    )

@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product_admin(
    product_id: int,
    data: ProductStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin cập nhật trạng thái hoặc số lượng tồn kho sản phẩm"""
    product = get_product_by_id_service(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sản phẩm không tồn tại"
        )
    
    update_data = ProductUpdate(**data.model_dump(exclude_unset=True))
    updated_product = update_product_service(db, product_id, update_data)
    
    # Broadcast thay đổi kho khi admin cập nhật số lượng
    if data.stock_quantity is not None:
        await notify_stock_change(db, product_id)
        
    return updated_product


@router.get("/product-meta-config", response_model=ProductMetaConfigIn)
def get_product_meta_config_admin(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    raw = _get_app_config_value(db, "product_meta_config")
    if not raw:
        return ProductMetaConfigIn(**DEFAULT_PRODUCT_META_CONFIG)
    try:
        import json

        data = json.loads(raw)
        merged = {**DEFAULT_PRODUCT_META_CONFIG, **(data or {})}
        return ProductMetaConfigIn(**merged)
    except Exception:
        return ProductMetaConfigIn(**DEFAULT_PRODUCT_META_CONFIG)


@router.put("/product-meta-config", response_model=ProductMetaConfigIn)
def update_product_meta_config_admin(
    body: ProductMetaConfigIn,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    import json

    payload = body.model_dump()
    _set_app_config_value(db, "product_meta_config", json.dumps(payload, ensure_ascii=False))
    return body
