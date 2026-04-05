import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

try:
    connection = pymysql.connect(
        host='localhost',
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

    with connection.cursor() as cursor:
        # Check if column exists
        cursor.execute("SHOW COLUMNS FROM products LIKE 'stock_quantity'")
        result = cursor.fetchone()
        
        if not result:
            print("Adding stock_quantity column...")
            cursor.execute("ALTER TABLE products ADD COLUMN stock_quantity INT NOT NULL DEFAULT 0")
            connection.commit()
            print("Column added successfully.")
        else:
            print("Column stock_quantity already exists.")

finally:
    if 'connection' in locals():
        connection.close()
