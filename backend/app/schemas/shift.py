from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel, field_validator, model_validator

DAY_TYPE_WEEKDAY = "weekday"
DAY_TYPE_SATURDAY = "saturday"
DAY_TYPE_SUNDAY = "sunday"
DAY_TYPE_PUBLIC_HOLIDAY = "public_holiday"
VALID_DAY_TYPES = {DAY_TYPE_WEEKDAY, DAY_TYPE_SATURDAY, DAY_TYPE_SUNDAY, DAY_TYPE_PUBLIC_HOLIDAY}


def _normalize_day_type_override(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    if value not in VALID_DAY_TYPES:
        raise ValueError(f"day_type_override must be one of {sorted(VALID_DAY_TYPES)} or empty")
    return value


class ShiftCreate(BaseModel):
    job_id: int
    shift_date: date
    start_time: time
    end_time: time
    crosses_midnight: bool = False
    unpaid_break_minutes: int = 0
    day_type_override: str | None = None
    notes: str | None = None

    @field_validator("day_type_override")
    @classmethod
    def normalize_day_type_override(cls, value: str | None) -> str | None:
        return _normalize_day_type_override(value)

    @model_validator(mode="after")
    def check_crosses_midnight_consistency(self) -> "ShiftCreate":
        implied_crosses_midnight = self.end_time <= self.start_time
        if implied_crosses_midnight and not self.crosses_midnight:
            raise ValueError(
                "end_time is not after start_time; set crosses_midnight=true if this "
                "shift ends the following calendar day"
            )
        return self


class ShiftUpdate(BaseModel):
    job_id: int | None = None
    shift_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    crosses_midnight: bool | None = None
    unpaid_break_minutes: int | None = None
    day_type_override: str | None = None
    notes: str | None = None

    @field_validator("day_type_override")
    @classmethod
    def normalize_day_type_override(cls, value: str | None) -> str | None:
        return _normalize_day_type_override(value)


class PayBreakdown(BaseModel):
    worked_hours: Decimal
    day_type: str
    hourly_rate_applied: Decimal
    gross_pay: Decimal
    rule_source_description: str


class ShiftRead(BaseModel):
    id: int
    job_id: int
    shift_date: date
    start_time: time
    end_time: time
    crosses_midnight: bool
    unpaid_break_minutes: int
    day_type_override: str | None
    notes: str | None
    worked_hours: Decimal
    resolved_day_type: str
    gross_pay: Decimal
