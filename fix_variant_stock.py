import pymysql

def fix_db():
    print("Đang kết nối tới database...")
    conn = pymysql.connect(
        host='localhost', port=3306,
        user='soncnjp', password='tranxuanson2k61810',
        database='pc_shop', charset='utf8mb4'
    )
    cur = conn.cursor()

    print("Đang đồng bộ số lượng trong kho của biến thể (variants) với sản phẩm gốc...")
    cur.execute("""
        UPDATE product_variants pv
        JOIN products p ON pv.product_id = p.id
        SET pv.stock_quantity = p.stock_quantity
    """)
    conn.commit()

    print(f"Cập nhật thành công {cur.rowcount} biến thể!")
    cur.close()
    conn.close()

if __name__ == '__main__':
    fix_db()
