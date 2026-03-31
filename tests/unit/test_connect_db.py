from app.db.session import engine

def test_database_connection():
    """
    Test case:
    Khi gọi engine.connect()
        -> Không được raise Exception (ném ra lỗi)
            -> Chứng minh kết nối được DB
    """

    connect = engine.connect()
    assert connect is not None
    connect.close()