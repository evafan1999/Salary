from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class PayRatePreset(SQLModel, table=True):
    """A snapshot of Fair Work Award hourly rates, manually entered by the user
    from the official Fair Work Pay Guide. Rates are stored as the final all-in
    hourly amount (casual loading already included) — this app never derives or
    guesses award dollar figures itself.
    """

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(description="e.g. 'Hospitality Award - Level 1 Casual (FY2025-26)'")
    award_reference: str | None = Field(default=None, description="e.g. MA000009, free text")
    base_hourly_rate: Decimal = Field(description="Weekday ordinary hourly rate")
    saturday_rate: Decimal
    sunday_rate: Decimal
    public_holiday_rate: Decimal
    casual_loading_pct: Decimal | None = Field(
        default=None, description="Informational only, not used in calculations"
    )
    effective_from: date
    effective_to: date | None = Field(default=None, description="Inclusive; null = still current")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
