"""add user payment, shipping address, phone tables

Revision ID: f1a2b3c4d5e6
Revises: 209d32e4694b
Create Date: 2026-04-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "209d32e4694b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_payment_methods",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("method_type", sa.String(length=20), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_payment_methods_id"), "user_payment_methods", ["id"], unique=False)
    op.create_index(op.f("ix_user_payment_methods_user_id"), "user_payment_methods", ["user_id"], unique=False)

    op.create_table(
        "user_shipping_addresses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipient_name", sa.String(length=200), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("address_line", sa.Text(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_shipping_addresses_id"), "user_shipping_addresses", ["id"], unique=False)
    op.create_index(op.f("ix_user_shipping_addresses_user_id"), "user_shipping_addresses", ["user_id"], unique=False)

    op.create_table(
        "user_phones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("phone_number", sa.String(length=30), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_phones_id"), "user_phones", ["id"], unique=False)
    op.create_index(op.f("ix_user_phones_user_id"), "user_phones", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_phones_user_id"), table_name="user_phones")
    op.drop_index(op.f("ix_user_phones_id"), table_name="user_phones")
    op.drop_table("user_phones")
    op.drop_index(op.f("ix_user_shipping_addresses_user_id"), table_name="user_shipping_addresses")
    op.drop_index(op.f("ix_user_shipping_addresses_id"), table_name="user_shipping_addresses")
    op.drop_table("user_shipping_addresses")
    op.drop_index(op.f("ix_user_payment_methods_user_id"), table_name="user_payment_methods")
    op.drop_index(op.f("ix_user_payment_methods_id"), table_name="user_payment_methods")
    op.drop_table("user_payment_methods")
