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
from app.repositories.product_repo.product_variant_repo import (
    get_product_variant_by_id_repo,
    get_variants_by_product_id_repo,
    create_product_variant_repo
)
from app.repositories.product_repo.product_repo import get_product_by_id_repo
from app.schemas.product.product_variant import ProductVariantCreate

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

def add_item_to_cart_service(
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

    # --- LOGIC KIỂM TRA KHO (RESERVATION) ---
    # Tính xem những người KHÁC đang giữ bao nhiêu
    from sqlalchemy import func
    reserved_others = db.query(func.sum(CartItem.quantity)).filter(
        CartItem.variant_id == variant_id,
        CartItem.cart_id != cart.id
    ).scalar() or 0
    
    # Tính số lượng tôi ĐANG có trong giỏ
    existing_item = get_cart_item_repo(db, cart.id, variant_id)
    current_in_my_cart = existing_item.quantity if existing_item else 0
    
    # Tổng số lượng tôi muốn có sau khi thêm
    total_wanted = current_in_my_cart + quantity
    
    if total_wanted > variant.stock_quantity - reserved_others:
        # Không đủ hàng để giữ thêm
        return None

    if existing_item:
        item = update_cart_item_qty_repo(db, existing_item, total_wanted)
    else:
        item = add_cart_item_repo(db, cart.id, variant_id, quantity)

    # Trả về format đồng nhất
    price = item.variant.price_override if item.variant.price_override is not None else item.variant.product.base_price
    return {
        "id": item.id,
        "cart_id": item.cart_id,
        "variant_id": item.variant_id,
        "quantity": item.quantity,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "variant": item.variant,
        "price": price,
        "subtotal": price * item.quantity
    }

def update_cart_item_qty_service(db: Session, user_id: int, item_id: int, quantity: int) -> Optional[Dict[str, Any]]:
    item = get_cart_item_by_id_repo(db, item_id)
    if not item or item.cart.user_id != user_id:
        return None
    
    # --- LOGIC KIỂM TRA KHO KHI CẬP NHẬT ---
    from sqlalchemy import func
    reserved_others = db.query(func.sum(CartItem.quantity)).filter(
        CartItem.variant_id == item.variant_id,
        CartItem.cart_id != item.cart_id
    ).scalar() or 0
    
    if quantity > item.variant.stock_quantity - reserved_others:
        # Vượt quá khả năng đáp ứng của kho
        return None
    
    updated_item = update_cart_item_qty_repo(db, item, quantity)
    price = updated_item.variant.price_override if updated_item.variant.price_override is not None else updated_item.variant.product.base_price
    
    return {
        "id": updated_item.id,
        "cart_id": updated_item.cart_id,
        "variant_id": updated_item.variant_id,
        "quantity": updated_item.quantity,
        "created_at": updated_item.created_at,
        "updated_at": updated_item.updated_at,
        "variant": updated_item.variant,
        "price": price,
        "subtotal": price * updated_item.quantity
    }

def delete_cart_item_service(db: Session, user_id: int, item_id: int) -> bool:
    item = get_cart_item_by_id_repo(db, item_id)
    if not item or item.cart.user_id != user_id:
        return False
    
    delete_cart_item_repo(db, item)
    return True
