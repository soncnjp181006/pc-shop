from jose import jwt, JWTError, ExpiredSignatureError
# jose: thư viện xử lý JWT (JSON Web Token)
# jwt: dùng để encode/decode token
# JWTError: lỗi chung khi token không hợp lệ (sai format, sai chữ ký...)
# ExpiredSignatureError: lỗi cụ thể khi token đã hết hạn

from fastapi.security import OAuth2PasswordBearer
# OAuth2PasswordBearer: schema xác thực theo chuẩn OAuth2 (dùng ở chỗ khác trong project)

from ..core.config import settings
# Import cấu hình chung: SECRET_KEY (khóa bí mật ký token), ALGORITHM (thuật toán mã hóa, vd: HS256)

from fastapi import HTTPException, status
# HTTPException: để trả về lỗi HTTP có status code và message
# status: chứa các hằng số HTTP status code (401, 200, 404...)


def decode_token(token: str) -> dict:
    # Hàm nhận vào một chuỗi token, trả về payload (dict) nếu hợp lệ

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,   # Trả về lỗi 401
        detail="Invalid credentials",               # Thông báo lỗi trả về client
        headers={"WWW-Authenticate": "Bearer"}      # Header chuẩn OAuth2, báo cho client biết cần dùng Bearer token
    )
    # Định nghĩa sẵn exception dùng chung cho cả 2 trường hợp lỗi bên dưới

    try:
        payload = jwt.decode(
            token=token,                        # Token cần giải mã
            key=settings.SECRET_KEY,            # Khóa bí mật để xác minh chữ ký
            algorithms=settings.ALGORITHM      # Thuật toán đã dùng khi tạo token (vd: ["HS256"])
        )
        return payload  # Trả về payload nếu token hợp lệ (chứa thông tin user, thời hạn...)

    except ExpiredSignatureError:
        # Token đúng định dạng và chữ ký hợp lệ, nhưng đã quá thời hạn (trường "exp")
        raise credentials_exception

    except JWTError:
        # Các lỗi JWT khác: sai chữ ký, sai format, payload bị chỉnh sửa...
        raise credentials_exception