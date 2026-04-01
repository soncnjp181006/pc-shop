"""remove unique username

Revision ID: 97114f122918
Revises: b7dcc03a0f02
Create Date: 2026-04-01 23:57:40.271236

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '97114f122918'
down_revision: Union[str, Sequence[str], None] = 'b7dcc03a0f02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
