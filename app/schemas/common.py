from pydantic import BaseModel, ConfigDict
from typing import Generic, TypeVar, List

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    limit: int
    pages: int

    model_config = ConfigDict(from_attributes=True)
