import requests

def test_api():
    try:
        # Giả lập call db trực tiếp tại thư mục
        from app.db.session import SessionLocal
        from app.services.product_service.product_service import get_all_products_service
        db = SessionLocal()
        res = get_all_products_service(db, active_only=False, limit=2)
        
        with open("C:/Users/soncnjp/Documents/WORKSPACE/pc-shop/api_debug.txt", "w", encoding="utf-8") as f:
            for p in res["data"]:
                f.write(f"Product {p.id}: {p.name}\n")
                f.write(f"  Kho (Total): {p.stock_quantity}\n")
                f.write(f"  Đã bán (Sold): {getattr(p, 'sold_count', 'N/A')}\n")
                f.write(f"  Chưa bán (Unsold): {getattr(p, 'unsold_stock', 'N/A')}\n")
                f.write(f"  Còn lại (Available): {getattr(p, 'available_stock', 'N/A')}\n")
                f.write("-" * 40 + "\n")
        db.close()
        print("Logged to api_debug.txt")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_api()
