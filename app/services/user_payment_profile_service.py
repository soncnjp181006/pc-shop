from typing import Optional

from sqlalchemy.orm import Session

from app.models.user_payment_profile import UserPaymentMethod, UserPhone, UserShippingAddress

ALLOWED_METHOD_TYPES = frozenset({"cod", "bank", "visa", "ewallet"})


def _clear_payment_defaults(db: Session, user_id: int, except_id: Optional[int] = None) -> None:
    q = db.query(UserPaymentMethod).filter(UserPaymentMethod.user_id == user_id)
    if except_id is not None:
        q = q.filter(UserPaymentMethod.id != except_id)
    q.update({UserPaymentMethod.is_default: False}, synchronize_session=False)


def _clear_address_defaults(db: Session, user_id: int, except_id: Optional[int] = None) -> None:
    q = db.query(UserShippingAddress).filter(UserShippingAddress.user_id == user_id)
    if except_id is not None:
        q = q.filter(UserShippingAddress.id != except_id)
    q.update({UserShippingAddress.is_default: False}, synchronize_session=False)


def _clear_phone_defaults(db: Session, user_id: int, except_id: Optional[int] = None) -> None:
    q = db.query(UserPhone).filter(UserPhone.user_id == user_id)
    if except_id is not None:
        q = q.filter(UserPhone.id != except_id)
    q.update({UserPhone.is_default: False}, synchronize_session=False)


# --- Payment methods ---
def list_payment_methods(db: Session, user_id: int) -> list[UserPaymentMethod]:
    return (
        db.query(UserPaymentMethod)
        .filter(UserPaymentMethod.user_id == user_id)
        .order_by(UserPaymentMethod.is_default.desc(), UserPaymentMethod.id.desc())
        .all()
    )


def create_payment_method(
    db: Session, user_id: int, method_type: str, label: Optional[str], is_default: bool
) -> UserPaymentMethod:
    if method_type not in ALLOWED_METHOD_TYPES:
        raise ValueError("method_type không hợp lệ")
    if is_default:
        _clear_payment_defaults(db, user_id)
    row = UserPaymentMethod(user_id=user_id, method_type=method_type, label=label, is_default=is_default)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_payment_method(
    db: Session,
    user_id: int,
    pm_id: int,
    method_type: Optional[str],
    label: Optional[str],
    is_default: Optional[bool],
) -> Optional[UserPaymentMethod]:
    row = (
        db.query(UserPaymentMethod)
        .filter(UserPaymentMethod.id == pm_id, UserPaymentMethod.user_id == user_id)
        .first()
    )
    if not row:
        return None
    if method_type is not None:
        if method_type not in ALLOWED_METHOD_TYPES:
            raise ValueError("method_type không hợp lệ")
        row.method_type = method_type
    if label is not None:
        row.label = label
    if is_default is not None:
        if is_default:
            _clear_payment_defaults(db, user_id, except_id=pm_id)
        row.is_default = is_default
    db.commit()
    db.refresh(row)
    return row


def delete_payment_method(db: Session, user_id: int, pm_id: int) -> bool:
    row = (
        db.query(UserPaymentMethod)
        .filter(UserPaymentMethod.id == pm_id, UserPaymentMethod.user_id == user_id)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


# --- Shipping addresses ---
def list_shipping_addresses(db: Session, user_id: int) -> list[UserShippingAddress]:
    return (
        db.query(UserShippingAddress)
        .filter(UserShippingAddress.user_id == user_id)
        .order_by(UserShippingAddress.is_default.desc(), UserShippingAddress.id.desc())
        .all()
    )


def create_shipping_address(
    db: Session,
    user_id: int,
    recipient_name: str,
    phone: str,
    address_line: str,
    note: Optional[str],
    is_default: bool,
) -> UserShippingAddress:
    if is_default:
        _clear_address_defaults(db, user_id)
    row = UserShippingAddress(
        user_id=user_id,
        recipient_name=recipient_name,
        phone=phone,
        address_line=address_line,
        note=note,
        is_default=is_default,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_shipping_address(
    db: Session,
    user_id: int,
    addr_id: int,
    recipient_name: Optional[str],
    phone: Optional[str],
    address_line: Optional[str],
    note: Optional[str],
    is_default: Optional[bool],
) -> Optional[UserShippingAddress]:
    row = (
        db.query(UserShippingAddress)
        .filter(UserShippingAddress.id == addr_id, UserShippingAddress.user_id == user_id)
        .first()
    )
    if not row:
        return None
    if recipient_name is not None:
        row.recipient_name = recipient_name
    if phone is not None:
        row.phone = phone
    if address_line is not None:
        row.address_line = address_line
    if note is not None:
        row.note = note
    if is_default is not None:
        if is_default:
            _clear_address_defaults(db, user_id, except_id=addr_id)
        row.is_default = is_default
    db.commit()
    db.refresh(row)
    return row


def delete_shipping_address(db: Session, user_id: int, addr_id: int) -> bool:
    row = (
        db.query(UserShippingAddress)
        .filter(UserShippingAddress.id == addr_id, UserShippingAddress.user_id == user_id)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


# --- Phones ---
def list_phones(db: Session, user_id: int) -> list[UserPhone]:
    return (
        db.query(UserPhone)
        .filter(UserPhone.user_id == user_id)
        .order_by(UserPhone.is_default.desc(), UserPhone.id.desc())
        .all()
    )


def create_phone(
    db: Session, user_id: int, phone_number: str, label: Optional[str], is_default: bool
) -> UserPhone:
    if is_default:
        _clear_phone_defaults(db, user_id)
    row = UserPhone(user_id=user_id, phone_number=phone_number, label=label, is_default=is_default)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_phone(
    db: Session,
    user_id: int,
    phone_id: int,
    phone_number: Optional[str],
    label: Optional[str],
    is_default: Optional[bool],
) -> Optional[UserPhone]:
    row = db.query(UserPhone).filter(UserPhone.id == phone_id, UserPhone.user_id == user_id).first()
    if not row:
        return None
    if phone_number is not None:
        row.phone_number = phone_number
    if label is not None:
        row.label = label
    if is_default is not None:
        if is_default:
            _clear_phone_defaults(db, user_id, except_id=phone_id)
        row.is_default = is_default
    db.commit()
    db.refresh(row)
    return row


def delete_phone(db: Session, user_id: int, phone_id: int) -> bool:
    row = db.query(UserPhone).filter(UserPhone.id == phone_id, UserPhone.user_id == user_id).first()
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True
