import sqlalchemy
from app.db.session import SessionLocal
from app.models.product_variant import ProductVariant

db = SessionLocal()
variants = db.query(ProductVariant).all()

for v in variants:
    if v.price_override is not None and v.product is not None:
        if v.price_override > v.product.base_price * 5:
            # Bug: price_override exceeds base price by 5x (likely typing 1 extra zero)
            print(f"Variant {v.id} (Product {v.product_id}): Price_override {v.price_override} -> fixing to {v.product.base_price}")
            v.price_override = v.product.base_price
        
db.commit()
print("Variant price overrides checked and fixed.")
