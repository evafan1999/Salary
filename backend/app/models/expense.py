from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class Expense(SQLModel, table=True):
    """One-off daily spending (groceries, transport, etc.) that isn't rent or a loan repayment."""

    id: int | None = Field(default=None, primary_key=True)
    description: str
    amount: Decimal
    expense_date: date
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
