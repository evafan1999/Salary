from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator

from app.schemas.common import empty_str_to_none


class PayRatePresetCreate(BaseModel):
    name: str
    award_reference: str | None = None
    base_hourly_rate: Decimal
    saturday_rate: Decimal
    sunday_rate: Decimal
    public_holiday_rate: Decimal
    casual_loading_pct: Decimal | None = None
    effective_from: date
    effective_to: date | None = None

    _normalize_casual_loading_pct = field_validator("casual_loading_pct", mode="before")(
        empty_str_to_none
    )
    _normalize_effective_to = field_validator("effective_to", mode="before")(empty_str_to_none)


class PayRatePresetUpdate(BaseModel):
    name: str | None = None
    award_reference: str | None = None
    base_hourly_rate: Decimal | None = None
    saturday_rate: Decimal | None = None
    sunday_rate: Decimal | None = None
    public_holiday_rate: Decimal | None = None
    casual_loading_pct: Decimal | None = None
    effective_from: date | None = None
    effective_to: date | None = None

    _normalize_casual_loading_pct = field_validator("casual_loading_pct", mode="before")(
        empty_str_to_none
    )
    _normalize_effective_to = field_validator("effective_to", mode="before")(empty_str_to_none)


class PayRatePresetRead(BaseModel):
    id: int
    name: str
    award_reference: str | None
    base_hourly_rate: Decimal
    saturday_rate: Decimal
    sunday_rate: Decimal
    public_holiday_rate: Decimal
    casual_loading_pct: Decimal | None
    effective_from: date
    effective_to: date | None
