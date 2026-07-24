from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class ExtraIncome(SQLModel, table=True):
    """One-off cash income that isn't tied to a scheduled Job shift (e.g. casual
    cash-in-hand help with no fixed hours), but should still count toward the
    week it was received and toward savings.
    """

    id: int | None = Field(default=None, primary_key=True)
    description: str
    amount: Decimal
    income_date: date
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
