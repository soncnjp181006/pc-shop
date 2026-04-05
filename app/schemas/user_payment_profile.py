from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

PaymentMethodType = Literal["cod", "bank", "visa", "ewallet"]


class UserPaymentMethodBase(BaseModel):
    method_type: PaymentMethodType
    label: Optional[str] = None
    is_default: bool = False


class UserPaymentMethodCreate(UserPaymentMethodBase):
    pass


class UserPaymentMethodUpdate(BaseModel):
    method_type: Optional[PaymentMethodType] = None
    label: Optional[str] = None
    is_default: Optional[bool] = None


class UserPaymentMethodOut(UserPaymentMethodBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserShippingAddressBase(BaseModel):
    recipient_name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., min_length=1, max_length=30)
    address_line: str = Field(..., min_length=1)
    note: Optional[str] = None
    is_default: bool = False


class UserShippingAddressCreate(UserShippingAddressBase):
    pass


class UserShippingAddressUpdate(BaseModel):
    recipient_name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, min_length=1, max_length=30)
    address_line: Optional[str] = Field(None, min_length=1)
    note: Optional[str] = None
    is_default: Optional[bool] = None


class UserShippingAddressOut(UserShippingAddressBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPhoneBase(BaseModel):
    phone_number: str = Field(..., min_length=1, max_length=30)
    label: Optional[str] = Field(None, max_length=100)
    is_default: bool = False


class UserPhoneCreate(UserPhoneBase):
    pass


class UserPhoneUpdate(BaseModel):
    phone_number: Optional[str] = Field(None, min_length=1, max_length=30)
    label: Optional[str] = Field(None, max_length=100)
    is_default: Optional[bool] = None


class UserPhoneOut(UserPhoneBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
