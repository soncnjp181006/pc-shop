import sqlalchemy
from app.db.session import SessionLocal
from app.models.product import Product

db = SessionLocal()
products = db.query(Product).limit(10).all()
with open("api_debug2.txt", "w", encoding="utf-8") as f:
    for p in products:
        f.write(f"ID={p.id} Brand='{p.brand}' Condition='{p.product_condition}' Origin='{p.origin}' Stock={p.stock_quantity}\n")
print("Done")
