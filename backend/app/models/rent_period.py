from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel, UniqueConstraint


class RentPeriod(SQLModel, table=True):
    """One rent agreement/cycle. Modeled as a table (not a single fixed value)
    so a house move can change the amount/cycle while preserving history.
    Rent due-dates are generated on the fly from start_date + cycle_days;
    confirmed payments against those due-dates are tracked in RentPayment.
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


class RentPayment(SQLModel, table=True):
    """Confirms that a specific scheduled due-date was actually paid."""

    __table_args__ = (UniqueConstraint("rent_period_id", "due_date"),)

    id: int | None = Field(default=None, primary_key=True)
    rent_period_id: int = Field(foreign_key="rentperiod.id")
    due_date: date = Field(description="Which scheduled due date this confirms")
    paid_date: date = Field(description="When it was actually paid")
    amount: Decimal
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
