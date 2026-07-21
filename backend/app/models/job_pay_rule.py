from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class JobPayRule(SQLModel, table=True):
    """Links a Job to either a PayRatePreset or fully custom rates, for a date
    range. This is the entity actually consulted at shift pay-calculation time.
    """

    id: int | None = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="job.id")
    rule_type: str = Field(description="'preset' or 'custom'")

    preset_id: int | None = Field(default=None, foreign_key="payratepreset.id")

    custom_weekday_rate: Decimal | None = None
    custom_saturday_rate: Decimal | None = None
    custom_sunday_rate: Decimal | None = None
    custom_public_holiday_rate: Decimal | None = None

    effective_from: date
    effective_to: date | None = Field(default=None, description="Inclusive; null = current")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
