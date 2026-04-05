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
        # Check if brand column exists
        cursor.execute("SHOW COLUMNS FROM products LIKE 'brand'")
        brand_exists = cursor.fetchone()
        
        if not brand_exists:
            print("Adding brand column...")
            cursor.execute("ALTER TABLE products ADD COLUMN brand VARCHAR(100) NULL AFTER image_url")
            print("Brand column added.")
        else:
            print("Brand column already exists.")

        # Check if status column exists
        cursor.execute("SHOW COLUMNS FROM products LIKE 'status'")
        status_exists = cursor.fetchone()
        
        if not status_exists:
            print("Adding status column...")
            cursor.execute("ALTER TABLE products ADD COLUMN status VARCHAR(50) NULL AFTER brand")
            print("Status column added.")
        else:
            print("Status column already exists.")

        connection.commit()

finally:
    if 'connection' in locals():
        connection.close()
