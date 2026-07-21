from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class SavingsGoal(SQLModel, table=True):
    """Only one row is expected to be is_active=True at a time (enforced in the
    service layer) — changing the goal deactivates the old row and creates a
    new one, preserving history rather than mutating in place.
    """

    id: int | None = Field(default=None, primary_key=True)
    target_amount: Decimal
    target_date: date = Field(description="Planned date to leave Australia")
    starting_balance: Decimal = Field(
        default=Decimal("0"), description="Savings already banked before tracking_start_date"
    )
    tracking_start_date: date = Field(
        description="Date from which shift income / rent / car-loan payments are summed"
    )
    is_active: bool = Field(default=True)
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
