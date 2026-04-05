from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.user.get_current_user import get_current_user
from app.models.user import User
from app.schemas.user_payment_profile import (
    UserPaymentMethodCreate,
    UserPaymentMethodOut,
    UserPaymentMethodUpdate,
    UserPhoneCreate,
    UserPhoneOut,
    UserPhoneUpdate,
    UserShippingAddressCreate,
    UserShippingAddressOut,
    UserShippingAddressUpdate,
)
from app.services import user_payment_profile_service as svc

router = APIRouter()


def _bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


@router.get("/checkout-profile")
def get_checkout_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Một lần gọi: phương thức thanh toán, địa chỉ, số điện thoại đã lưu."""
    return {
        "payment_methods": [
            UserPaymentMethodOut.model_validate(x) for x in svc.list_payment_methods(db, current_user.id)
        ],
        "shipping_addresses": [
            UserShippingAddressOut.model_validate(x) for x in svc.list_shipping_addresses(db, current_user.id)
        ],
        "phones": [UserPhoneOut.model_validate(x) for x in svc.list_phones(db, current_user.id)],
    }


# --- Payment methods ---
@router.get("/payment-methods", response_model=list[UserPaymentMethodOut])
def list_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.list_payment_methods(db, current_user.id)


@router.post("/payment-methods", response_model=UserPaymentMethodOut, status_code=status.HTTP_201_CREATED)
def create_payment_method(
    body: UserPaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return svc.create_payment_method(
            db,
            current_user.id,
            body.method_type,
            body.label,
            body.is_default,
        )
    except ValueError as e:
        raise _bad_request(str(e)) from e


@router.put("/payment-methods/{pm_id}", response_model=UserPaymentMethodOut)
def update_payment_method(
    pm_id: int,
    body: UserPaymentMethodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        row = svc.update_payment_method(
            db,
            current_user.id,
            pm_id,
            body.method_type,
            body.label,
            body.is_default,
        )
    except ValueError as e:
        raise _bad_request(str(e)) from e
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy")
    return row


@router.delete("/payment-methods/{pm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_method(
    pm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not svc.delete_payment_method(db, current_user.id, pm_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy")
    return None


# --- Shipping addresses ---
@router.get("/shipping-addresses", response_model=list[UserShippingAddressOut])
def list_shipping_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.list_shipping_addresses(db, current_user.id)


@router.post("/shipping-addresses", response_model=UserShippingAddressOut, status_code=status.HTTP_201_CREATED)
def create_shipping_address(
    body: UserShippingAddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.create_shipping_address(
        db,
        current_user.id,
        body.recipient_name,
        body.phone,
        body.address_line,
        body.note,
        body.is_default,
    )


@router.put("/shipping-addresses/{addr_id}", response_model=UserShippingAddressOut)
def update_shipping_address(
    addr_id: int,
    body: UserShippingAddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = svc.update_shipping_address(
        db,
        current_user.id,
        addr_id,
        body.recipient_name,
        body.phone,
        body.address_line,
        body.note,
        body.is_default,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy")
    return row


@router.delete("/shipping-addresses/{addr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shipping_address(
    addr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not svc.delete_shipping_address(db, current_user.id, addr_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy")
    return None


# --- Phones ---
@router.get("/phones", response_model=list[UserPhoneOut])
def list_phones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.list_phones(db, current_user.id)


@router.post("/phones", response_model=UserPhoneOut, status_code=status.HTTP_201_CREATED)
def create_phone(
    body: UserPhoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return svc.create_phone(db, current_user.id, body.phone_number, body.label, body.is_default)


@router.put("/phones/{phone_id}", response_model=UserPhoneOut)
def update_phone(
    phone_id: int,
    body: UserPhoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = svc.update_phone(
        db,
        current_user.id,
        phone_id,
        body.phone_number,
        body.label,
        body.is_default,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy")
    return row


@router.delete("/phones/{phone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_phone(
    phone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not svc.delete_phone(db, current_user.id, phone_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy")
    return None
