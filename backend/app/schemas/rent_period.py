from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator

from app.schemas.common import empty_str_to_none


class RentPeriodCreate(BaseModel):
    label: str
    amount: Decimal
    cycle_days: int
    start_date: date
    end_date: date | None = None
    deposit_amount: Decimal | None = None
    notes: str | None = None

    _normalize_end_date = field_validator("end_date", mode="before")(empty_str_to_none)
    _normalize_deposit_amount = field_validator("deposit_amount", mode="before")(
        empty_str_to_none
    )


class RentPeriodUpdate(BaseModel):
    label: str | None = None
    amount: Decimal | None = None
    cycle_days: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    deposit_amount: Decimal | None = None
    notes: str | None = None

    _normalize_end_date = field_validator("end_date", mode="before")(empty_str_to_none)
    _normalize_deposit_amount = field_validator("deposit_amount", mode="before")(
        empty_str_to_none
    )


class RentPeriodRead(BaseModel):
    id: int
    label: str
    amount: Decimal
    cycle_days: int
    start_date: date
    end_date: date | None
    deposit_amount: Decimal | None
    notes: str | None


class UpcomingRentDue(BaseModel):
    rent_period_id: int
    label: str
    amount: Decimal
    due_date: date
