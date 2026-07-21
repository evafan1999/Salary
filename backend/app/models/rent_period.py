from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class RentPeriod(SQLModel, table=True):
    """One rent agreement/cycle. Modeled as a table (not a single fixed value)
    so a house move can change the amount/cycle while preserving history.
    Rent due-dates are generated on the fly from start_date + cycle_days —
    there is deliberately no payment-confirmation ledger (out of scope).
    """

    id: int | None = Field(default=None, primary_key=True)
    label: str = Field(description="e.g. 'Share house - Surry Hills'")
    amount: Decimal
    cycle_days: int = Field(description="e.g. 7 weekly, 14 fortnightly, 28 four-weekly")
    start_date: date = Field(description="First rent-due date this agreement began")
    end_date: date | None = Field(default=None, description="Null = ongoing/current")
    deposit_amount: Decimal | None = None
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
