from datetime import UTC, date, datetime, time

from sqlmodel import Field, SQLModel


class Shift(SQLModel, table=True):
    """A single worked shift. worked_hours / resolved_day_type / gross_pay are
    NOT stored — they are computed at read time by services.pay_calculator so
    that editing a JobPayRule or PublicHoliday retroactively corrects historical
    figures.
    """

    id: int | None = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="job.id")
    shift_date: date = Field(description="The calendar date the shift starts on")
    start_time: time
    end_time: time
    crosses_midnight: bool = Field(
        default=False, description="True if the shift ends on the following calendar day"
    )
    unpaid_break_minutes: int = Field(default=0)
    day_type_override: str | None = Field(
        default=None,
        description="'weekday' | 'saturday' | 'sunday' | 'public_holiday', overrides auto-detection",
    )
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
