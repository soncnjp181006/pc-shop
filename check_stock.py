"""Debug script: kiểm tra stock_quantity trong DB"""
import pymysql

conn = pymysql.connect(
    host='localhost', port=3306,
    user='soncnjp', password='tranxuanson2k61810',
    database='pc_shop', charset='utf8mb4'
)
cur = conn.cursor()

print("=== PRODUCTS stock_quantity ===")
cur.execute("SELECT id, name, stock_quantity FROM products ORDER BY id DESC LIMIT 10")
for row in cur.fetchall():
    print(f"  Product {row[0]}: {row[1][:40]} => stock_quantity={row[2]}")

print("\n=== PRODUCT VARIANTS stock_quantity ===")
cur.execute("""
    SELECT pv.id, pv.product_id, p.name, pv.sku, pv.stock_quantity
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    ORDER BY pv.id DESC LIMIT 20
""")
for row in cur.fetchall():
    print(f"  Variant {row[0]} (product {row[1]}: {row[2][:30]}), SKU={row[3]}, stock={row[4]}")

print("\n=== CART ITEMS ===")
cur.execute("SELECT variant_id, SUM(quantity) as qty FROM cart_items GROUP BY variant_id")
for row in cur.fetchall():
    print(f"  variant_id={row[0]}, total_in_cart={row[1]}")

print("\n=== ORDER ITEMS (non-cancelled) ===")
cur.execute("""
    SELECT oi.variant_id, SUM(oi.quantity) as qty
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status NOT IN ('cancelled', 'returned')
    GROUP BY oi.variant_id
""")
for row in cur.fetchall():
    print(f"  variant_id={row[0]}, total_sold={row[1]}")

cur.close()
conn.close()
