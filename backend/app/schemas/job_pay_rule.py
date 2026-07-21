from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator, model_validator

from app.schemas.common import empty_str_to_none


def _validate_rule_shape(rule_type: str, preset_id, custom_fields: list) -> None:
    if rule_type not in ("preset", "custom"):
        raise ValueError("rule_type must be 'preset' or 'custom'")
    if rule_type == "preset":
        if preset_id is None:
            raise ValueError("preset_id is required when rule_type is 'preset'")
        if any(f is not None for f in custom_fields):
            raise ValueError("custom_* fields must be empty when rule_type is 'preset'")
    else:
        if preset_id is not None:
            raise ValueError("preset_id must be empty when rule_type is 'custom'")
        if any(f is None for f in custom_fields):
            raise ValueError("all custom_* fields are required when rule_type is 'custom'")


class JobPayRuleCreate(BaseModel):
    rule_type: str
    preset_id: int | None = None
    custom_weekday_rate: Decimal | None = None
    custom_saturday_rate: Decimal | None = None
    custom_sunday_rate: Decimal | None = None
    custom_public_holiday_rate: Decimal | None = None
    effective_from: date
    effective_to: date | None = None

    _normalize_effective_to = field_validator("effective_to", mode="before")(empty_str_to_none)
    _normalize_weekday = field_validator("custom_weekday_rate", mode="before")(empty_str_to_none)
    _normalize_saturday = field_validator("custom_saturday_rate", mode="before")(
        empty_str_to_none
    )
    _normalize_sunday = field_validator("custom_sunday_rate", mode="before")(empty_str_to_none)
    _normalize_public_holiday = field_validator(
        "custom_public_holiday_rate", mode="before"
    )(empty_str_to_none)

    @model_validator(mode="after")
    def check_shape(self) -> "JobPayRuleCreate":
        _validate_rule_shape(
            self.rule_type,
            self.preset_id,
            [
                self.custom_weekday_rate,
                self.custom_saturday_rate,
                self.custom_sunday_rate,
                self.custom_public_holiday_rate,
            ],
        )
        return self


class JobPayRuleUpdate(BaseModel):
    rule_type: str | None = None
    preset_id: int | None = None
    custom_weekday_rate: Decimal | None = None
    custom_saturday_rate: Decimal | None = None
    custom_sunday_rate: Decimal | None = None
    custom_public_holiday_rate: Decimal | None = None
    effective_from: date | None = None
    effective_to: date | None = None


class JobPayRuleRead(BaseModel):
    id: int
    job_id: int
    rule_type: str
    preset_id: int | None
    custom_weekday_rate: Decimal | None
    custom_saturday_rate: Decimal | None
    custom_sunday_rate: Decimal | None
    custom_public_holiday_rate: Decimal | None
    effective_from: date
    effective_to: date | None
