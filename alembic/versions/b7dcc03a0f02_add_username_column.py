"""add username column

Revision ID: b7dcc03a0f02
Revises: 37ac3676d113
Create Date: 2026-04-01 13:08:27.162195
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7dcc03a0f02'
down_revision: Union[str, Sequence[str], None] = '37ac3676d113'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Thêm column (nullable=True + có length cho MySQL)
    op.add_column(
        'users',
        sa.Column('username', sa.String(50), nullable=True)
    )

    # 2. Fill dữ liệu cũ (tránh NULL + đảm bảo unique)
    op.execute("UPDATE users SET username = email")

    # 3. Set NOT NULL
    op.alter_column(
        'users',
        'username',
        existing_type=sa.String(50),
        nullable=False
    )

    # 4. Add UNIQUE constraint (đặt tên rõ ràng)
    op.create_unique_constraint(
        'uq_users_username',
        'users',
        ['username']
    )


def downgrade() -> None:
    # Xóa unique trước
    op.drop_constraint('uq_users_username', 'users', type_='unique')

    # Xóa column
    op.drop_column('users', 'username')