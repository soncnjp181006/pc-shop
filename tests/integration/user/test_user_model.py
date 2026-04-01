"""
Test User model + migration

Mục tiêu: 
    - Đảm bảo bảng users đã được tạo trong DB
    - Bảng users có đầy đủ các cột cần thiết
"""

from sqlalchemy import text
from app.db.session import engine

def test_users_table_exists():
    """
    Test case 1: Kiểm tra bảng users có tồn tại trong DB hay không
        - Query trực tiếp vào DB
        - Nếu bảng không tồn tại -> MySQL sẽ throw lỗi
        - Nếu tồn tại -> Query chạy OK
    """

    with engine.connect() as connection:
        result = connection.execute(
            text("SHOW TABLES LIKE 'users';") # Hiện bảng user (LIKE '%_%')
        )

        table = result.fetchone() # Lấy dòng đầu tiên

        # Đảm bảo bảng users tồn tại
        assert table is not None

def test_users_table_columns():
    """
    Test case 2: Kiểm tra bảng users có đầy đủ các cột hay không
        - Dùng SQL: SHOW COLUMNS FROM users;
        - Lấy danh sách cột
        - So sánh kết quả mong đợi
    """

    with engine.connect() as connection:
        # Lấy tất cả các cột trong bảng user
        result = connection.execute(
            text("SHOW COLUMNS FROM users;")
        )

        # result.fetchall() -> list các dòng
        # mỗi dòng chứa info của một column
        # index [0] là tên cột ở mỗi dòng
        columns = result.fetchall()

        # Lấy tên cột (Field)
        column_names = [col[0] for col in columns]

        # List danh sách các cột trong một user cơ bản
        # Danh sách cột mong đợi có đầy đủ
        expected_columns = [
            'id', 'email', 'username', 'hashed_password',
            'is_active', 'role', 'created_at'
        ]

        # Kiểm tra từng cột có tồn tại không
        # Cách 1: Lấy từng giá trị trong expected_name để xem có nằm trong column_names
        #   for col in expected_columns:
        #       assert col in column_names
        # Cách 2: Sắp xếp 2 danh sách và so sánh
        assert sorted(column_names) == sorted(expected_columns)