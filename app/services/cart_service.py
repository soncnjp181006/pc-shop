from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
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
from app.repositories.product_repo.product_variant_repo import (
    get_product_variant_by_id_repo,
    get_variants_by_product_id_repo,
    create_product_variant_repo
)
from app.repositories.product_repo.product_repo import get_product_by_id_repo
from app.schemas.product.product_variant import ProductVariantCreate
from app.core.websocket_manager import manager
import asyncio

def get_or_create_cart_service(db: Session, user_id: int) -> Cart:
    cart = get_cart_by_user_id_repo(db, user_id)
    if not cart:
        cart = create_cart_repo(db, user_id)
    return cart

def get_cart_details_service(db: Session, user_id: int) -> Dict[str, Any]:
    cart = get_or_create_cart_service(db, user_id)
    
    total_price = 0.0
    items_out = []
    
    # Danh sách các item cần xóa vì không còn variant/product tương ứng
    items_to_delete = []
    
    for item in cart.items:
        variant = item.variant
        # Nếu variant hoặc product của nó không tồn tại, bỏ qua và đánh dấu để xóa
        if not variant or not variant.product:
            items_to_delete.append(item)
            continue
            
        # Lấy giá của variant (nếu có override, dùng price_override, ngược lại dùng base_price của product)
        price = variant.price_override if variant.price_override is not None else variant.product.base_price
        subtotal = price * item.quantity
        total_price += subtotal
        
        # Tạo bản sao của item để thêm giá và subtotal vào response
        item_dict = {
            "id": item.id,
            "cart_id": item.cart_id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "variant": variant,
            "price": price,
            "subtotal": subtotal
        }
        items_out.append(item_dict)
    
    # Dọn dẹp các item rác trong DB
    for item in items_to_delete:
        delete_cart_item_repo(db, item)
    
    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": items_out,
        "total_price": total_price,
        "created_at": cart.created_at,
        "updated_at": cart.updated_at
    }

async def notify_stock_change(db: Session, product_id: int):
    """Gửi thông báo thay đổi kho chi tiết qua WebSocket (Đã tối ưu hóa và đảm bảo nhất quán)"""
    from app.models.product import Product
    from app.models.product_variant import ProductVariant
    from app.models.cart import CartItem
    from sqlalchemy import func
    import time
    
    # 1. Đảm bảo dữ liệu mới nhất được ghi vào DB
    db.commit() 
    db.expire_all()
    
    # 2. Lấy thông tin product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product: return
    
    # 3. Lấy tất cả variants
    variants = db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()
    if not variants:
        # Nếu không có variant, chỉ broadcast thông tin product cơ bản
        payload = {
            "type": "stock_updated",
            "product_id": product_id,
            "available_stock": product.stock_quantity,
            "variants": [],
            "ts": time.time()
        }
        await manager.broadcast(payload)
        return
    
    # 4. Tính tổng số lượng đã đặt cho từng variant
    v_ids = [v.id for v in variants]
    variant_reservations = db.query(
        CartItem.variant_id, 
        func.sum(CartItem.quantity).label('reserved_qty')
    ).filter(CartItem.variant_id.in_(v_ids))\
     .group_by(CartItem.variant_id).all()
    
    res_map = {r.variant_id: int(r.reserved_qty) for r in variant_reservations}
    
    # 5. Chuẩn bị payload
    total_reserved = sum(res_map.values())
    product_available = max(0, product.stock_quantity - total_reserved)
    
    variants_out = []
    for v in variants:
        v_res = res_map.get(v.id, 0)
        v_available = max(0, v.stock_quantity - v_res)
        variants_out.append({
            "id": v.id,
            "available_stock": v_available
        })
    
    payload = {
        "type": "stock_updated",
        "product_id": product_id,
        "available_stock": product_available,
        "variants": variants_out,
        "ts": time.time()
    }
    await manager.broadcast(payload)

async def add_item_to_cart_service(
    db: Session, 
    user_id: int, 
    variant_id: Optional[int], 
    quantity: int,
    product_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    cart = get_or_create_cart_service(db, user_id)
    
    # Nếu không có variant_id nhưng có product_id, tìm hoặc tạo variant mặc định
    if not variant_id and product_id:
        variants = get_variants_by_product_id_repo(db, product_id)
        if variants:
            variant_id = variants[0].id
        else:
            product = get_product_by_id_repo(db, product_id)
            if not product: return None
            
            default_variant_in = ProductVariantCreate(
                product_id=product_id,
                sku=f"DEFAULT-{product.slug}-{product_id}",
                attributes={"type": "Default"},
                price_override=product.base_price,
                stock_quantity=product.stock_quantity,
                is_active=True
            )
            new_variant = create_product_variant_repo(db, default_variant_in)
            variant_id = new_variant.id

    if not variant_id: return None

    # Kiểm tra variant có tồn tại không
    variant = get_product_variant_by_id_repo(db, variant_id)
    if not variant: return None
    
    target_product_id = variant.product_id

    # --- LOGIC KIỂM TRA KHO (RESERVATION) ---
    from sqlalchemy import func
    reserved_others = db.query(func.sum(CartItem.quantity)).filter(
        CartItem.variant_id == variant_id,
        CartItem.cart_id != cart.id
    ).scalar() or 0
    
    existing_item = get_cart_item_repo(db, cart.id, variant_id)
    current_in_my_cart = existing_item.quantity if existing_item else 0
    total_wanted = current_in_my_cart + quantity
    
    if total_wanted > variant.stock_quantity - reserved_others:
        return None

    if existing_item:
        item = update_cart_item_qty_repo(db, existing_item, total_wanted)
    else:
        item = add_cart_item_repo(db, cart.id, variant_id, quantity)

    # Lấy thông tin giá trước khi notify (tránh lỗi session expired/commit)
    price = item.variant.price_override if item.variant.price_override is not None else item.variant.product.base_price
    item_id = item.id
    v_id = item.variant_id
    qty = item.quantity
    created = item.created_at
    updated = item.updated_at
    variant_obj = item.variant # SQLAlchemy sẽ load object này

    # Broadcast thay đổi - dùng await trực tiếp để tránh lỗi session closed
    await notify_stock_change(db, target_product_id)

    return {
        "id": item_id,
        "cart_id": cart.id,
        "variant_id": v_id,
        "quantity": qty,
        "created_at": created,
        "updated_at": updated,
        "variant": variant_obj,
        "price": price,
        "subtotal": price * qty
    }

async def update_cart_item_qty_service(db: Session, user_id: int, item_id: int, quantity: int) -> Optional[Dict[str, Any]]:
    item = get_cart_item_by_id_repo(db, item_id)
    if not item or item.cart.user_id != user_id:
        return None
    
    target_product_id = item.variant.product_id

    from sqlalchemy import func
    reserved_others = db.query(func.sum(CartItem.quantity)).filter(
        CartItem.variant_id == item.variant_id,
        CartItem.cart_id != item.cart_id
    ).scalar() or 0
    
    if quantity > item.variant.stock_quantity - reserved_others:
        return None
    
    updated_item = update_cart_item_qty_repo(db, item, quantity)
    
    # Lấy thông tin giá trước khi notify
    price = updated_item.variant.price_override if updated_item.variant.price_override is not None else updated_item.variant.product.base_price
    u_item_id = updated_item.id
    c_id = updated_item.cart_id
    v_id = updated_item.variant_id
    qty = updated_item.quantity
    created = updated_item.created_at
    updated = updated_item.updated_at
    variant_obj = updated_item.variant

    # Broadcast thay đổi
    await notify_stock_change(db, target_product_id)

    return {
        "id": u_item_id,
        "cart_id": c_id,
        "variant_id": v_id,
        "quantity": qty,
        "created_at": created,
        "updated_at": updated,
        "variant": variant_obj,
        "price": price,
        "subtotal": price * qty
    }

async def delete_cart_item_service(db: Session, user_id: int, item_id: int) -> bool:
    item = get_cart_item_by_id_repo(db, item_id)
    if not item or item.cart.user_id != user_id:
        return False
    
    target_product_id = item.variant.product_id
    delete_cart_item_repo(db, item)
    # Broadcast thay đổi
    await notify_stock_change(db, target_product_id)
    return True
