from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.order import Order, OrderItem, OrderStatus
from app.services.cart_service import notify_stock_change

async def checkout_cart_service(
    db: Session,
    user_id: int,
    full_name: str,
    phone: str,
    address: str,
    note: Optional[str],
    payment_method: str,
    item_ids: List[int],
    item_quantities: Dict[int, int],
    total_amount: float
) -> Order:
    # 1. Fetch user's cart
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        raise HTTPException(status_code=400, detail="Cart not found")
        
    # 2. Fetch selected items
    items = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.id.in_(item_ids)
    ).all()
    
    if not items:
        raise HTTPException(status_code=400, detail="No valid items selected for checkout")
        
    # 3. Create the Order
    order = Order(
        user_id=user_id,
        full_name=full_name,
        phone=phone,
        address=address,
        note=note,
        payment_method=payment_method,
        total_amount=total_amount,
        status=OrderStatus.PENDING
    )
    db.add(order)
    db.flush() # get order.id
    
    # 4. Iterate items and create OrderItems
    # ALSO DEDUCT STOCK REAL TIME!
    product_ids_to_notify = set()
    
    for item in items:
        variant = item.variant
        product = variant.product
        
        # Determine quantity desired (from map, fallback to item.quantity)
        qty = item_quantities.get(item.id, item.quantity)
        
        # Safety check: Do we have enough physical stock?
        # Physical stock = product.stock_quantity
        if product.stock_quantity < qty or variant.stock_quantity < qty:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock for {product.name}"
            )
            
        # Deduct Physical Stock in DB
        product.stock_quantity -= qty
        variant.stock_quantity -= qty
        
        # Create OrderItem config snapshot
        price = variant.price_override if variant.price_override is not None else product.base_price
        order_item = OrderItem(
            order_id=order.id,
            variant_id=variant.id,
            product_name=product.name,
            sku=variant.sku or str(variant.id),
            price=price,
            quantity=qty,
            attributes=variant.attributes,
            image_url=product.image_url
        )
        db.add(order_item)
        
        # Remove item from cart if checkout quantity is same as cart quantity
        if qty >= item.quantity:
            db.delete(item)
        else:
            item.quantity -= qty
            
        product_ids_to_notify.add(product.id)
        
    db.commit()
    db.refresh(order)
    
    # 5. Broadcast stock updates in real_time
    for pid in product_ids_to_notify:
        await notify_stock_change(db, pid)
        
    return order
