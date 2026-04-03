import traceback
import sys
import os

def test_db():
    try:
        import pymysql
        from dotenv import load_dotenv
        load_dotenv()
        
        conn = pymysql.connect(
            host='localhost',
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME')
        )
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, stock_quantity FROM products LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        return f"DB Connection OK. Found product: {row}"
    except Exception as e:
        return f"DB Error: {traceback.format_exc()}"

if __name__ == "__main__":
    result = test_db()
    with open("test_db_out.txt", "w") as f:
        f.write(result)
