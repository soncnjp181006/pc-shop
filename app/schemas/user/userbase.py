from pydantic import (
    BaseModel,          # Class tạo bộ lọc
    EmailStr,           # Class ép kiểu, bắt lỗi email
    field_serializer    # Phương thức dùng để kiểm tra
)
from typing import Optional # Optional cho phép None

class UserBase(BaseModel):
    """Class dùng chung"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    # EmailStr: Pydantic tự validate format email
    # "notanemail" -> raise ValidationError -> 422
    password: Optional[str] = None



    # Validator cho username (kiểm tra -> bắt lỗi username)
    @field_serializer('username') # Không hoạt động nếu None
    @classmethod
    def username_format(cls, v: str) -> str:
        """
        Kiểm tra có lỗi tên hay không:

        Format cơ bản:
        + length hợp lệ (ví dụ: 3–30 ký tự)
        + không chứa icon/emoji
        + chỉ chứa ký tự cho phép (a-z, A-Z, 0-9, _, .)
        + không chứa khoảng trắng (tab, newline)
        # + không bắt đầu hoặc kết thúc bằng ký tự đặc biệt (_ .)
        # + không có ký tự đặc biệt liên tiếp (__, .., _., ._)

        Chuẩn hóa dữ liệu:
        + trim khoảng trắng đầu/cuối
        # + chuyển về lowercase
        # + chuẩn hóa Unicode (NFKC)

        An toàn dữ liệu:
        + không chứa control character (\n, \t, \0, ...)
        + không chứa ký tự escape nguy hiểm

        Giới hạn hợp lý
        + không toàn số (tùy rule)
        + không toàn ký tự lặp (aaaaaa, 111111)
        # + không quá giống pattern spam (abc123123)
        """
        import regex # Dùng để bắt lỗi ký tự emoji
        EMOJI_PATTERN = regex.compile(r'(\X)(?=\p{Emoji})')

        if len(v) < 5:
            raise ValueError("Độ dài quá ngắn")
        if len(v) > 100:
            raise ValueError("Tên quá dài")
        if EMOJI_PATTERN.search(v): # Tìm thấy ký tự emoji/icon
            raise ValueError("Không được chứa icon/emoji")
        if "\t" in v:
            raise ValueError("Tên không được chứa ký tự tab")
        if "\n" in v:
            raise ValueError("Tên không được chứa ký tự xuống dòng")
        
        # v không được chứa [-, +, (, ), {, }, ',', '.', '/', '?', '!', '@', ...]
        SPECIAL_CHARS = [
            '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
            ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '`', '{', '|', '}', '~'
        ]

        for val in SPECIAL_CHARS:
            if val in v:
                raise ValueError("Tên không được chứa ký tự đặc biệt")
            
        # Chuẩn hóa dữ liệu, loại bỏ khoảng trắng ở đầu và cuối chuỗi tên
        v = v.strip()

        # Kiểm tra tên có toàn chữ số hay không
        if v.isdigit():
            raise ValueError("Tên không được chứa toàn chữ số")
        

        # Kiểm tra tên có đáp ứng tiêu chuẩn an toàn
        import unicodedata

        # Chuẩn hóa Unicode (NFKC)
        v = unicodedata.normalize('NFKC', v)

        # Kiểm tra ký tự escape nguy hiểm
        UNSAFE_CHARS = ['\\', '"', "'", '`']
        for c in UNSAFE_CHARS:
            if c in v:
                raise ValueError(f"Tên không được chứa ký tự escape nguy hiểm: {c}")

        # Kiểm tra control character còn sót (ASCII 0-31 và 127)
        for c in v:
            if ord(c) < 32 or ord(c) == 127:
                raise ValueError(f"Tên chứa ký tự điều khiển không hợp lệ: {repr(c)}")

        # Kiểm tra bộ ký tự lặp liên tiếp >= 3 (ví dụ: aaa, 111, ...)
        import re
        repeated_blocks = re.findall(r'(.)\1{2,}', v)  # 3 ký tự trở lên
        if repeated_blocks:
            raise ValueError(f"Tên chứa ký tự lặp liên tiếp quá nhiều: {set(repeated_blocks)}")

        return v
    

    
    # Validator cho password (kiểm tra -> bắt lỗi password)
    @field_serializer('password')
    @classmethod
    def password_format(cls, v: str) -> str:
        """
        Kiểm tra password theo các tiêu chí:

        Format cơ bản:
        + length hợp lệ (ví dụ: 8–64 ký tự)
        + chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
        + không chứa khoảng trắng (space, tab, newline)

        An toàn dữ liệu:
        + không chứa control character (\n, \t, \0, ...)
        + không chứa ký tự escape nguy hiểm (\ " ' `)

        Chuẩn hóa dữ liệu:
        + trim khoảng trắng đầu/cuối
        + chuẩn hóa Unicode (NFKC)
        """

        import unicodedata
        import re

        # Chuẩn hóa Unicode
        v = unicodedata.normalize('NFKC', v)

        # Loại bỏ khoảng trắng đầu/cuối
        v = v.strip()

        # Kiểm tra độ dài
        if len(v) < 8:
            raise ValueError("Password quá ngắn, tối thiểu 8 ký tự")
        if len(v) > 64:
            raise ValueError("Password quá dài, tối đa 64 ký tự")

        # Kiểm tra khoảng trắng
        if any(c.isspace() for c in v):
            raise ValueError("Password không được chứa khoảng trắng")

        # Kiểm tra control character
        for c in v:
            if ord(c) < 32 or ord(c) == 127:
                raise ValueError(f"Password chứa ký tự điều khiển không hợp lệ: {repr(c)}")

        # Kiểm tra escape nguy hiểm
        UNSAFE_CHARS = ['\\', '"', "'", '`']
        for c in UNSAFE_CHARS:
            if c in v:
                raise ValueError(f"Password chứa ký tự escape nguy hiểm: {c}")

        # Kiểm tra bắt buộc các loại ký tự
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password phải chứa ít nhất 1 chữ hoa (A-Z)")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password phải chứa ít nhất 1 chữ thường (a-z)")
        if not re.search(r'[0-9]', v):
            raise ValueError("Password phải chứa ít nhất 1 chữ số (0-9)")
        if not re.search(r'[!@#$%^&*()_\-+=\[\]{}|;:,.<>?/`~]', v):
            raise ValueError("Password phải chứa ít nhất 1 ký tự đặc biệt")

        # Kiểm tra ký tự lặp liên tiếp >= 3 (aaa, 111, ...)
        repeated_blocks = re.findall(r'(.)\1{2,}', v)
        if repeated_blocks:
            raise ValueError(f"Password chứa ký tự lặp liên tiếp quá nhiều: {set(repeated_blocks)}")

        return v