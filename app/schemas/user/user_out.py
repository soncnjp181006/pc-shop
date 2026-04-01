from pydantic import(
    BaseModel,
    EmailStr # Class ép kiểu, bắt lỗi email
)

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr 
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
    # from_attributes=True: cho phép Pydantic đọc từ SQLAlchemy model object
    # Không có dòng này → Pydantic không thể convert User model → UserOut schema