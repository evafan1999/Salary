from dataclasses import dataclass
from datetime import date, time
from decimal import Decimal

from sqlmodel import Session, select

from app.exceptions import NoApplicableRuleError
from app.models.job import Job
from app.models.job_pay_rule import JobPayRule
from app.models.pay_rate_preset import PayRatePreset
from app.models.public_holiday import PublicHoliday
from app.models.shift import Shift
from app.schemas.shift import (
    DAY_TYPE_PUBLIC_HOLIDAY,
    DAY_TYPE_SATURDAY,
    DAY_TYPE_SUNDAY,
    DAY_TYPE_WEEKDAY,
    PayBreakdown,
)

NATIONAL_HOLIDAY_STATE = "NAT"


@dataclass
class ResolvedRate:
    weekday_rate: Decimal
    saturday_rate: Decimal
    sunday_rate: Decimal
    public_holiday_rate: Decimal
    source_description: str


def resolve_day_type(
    session: Session, job: Job, shift_date: date, override: str | None
) -> str:
    if override is not None:
        return override

    holiday = session.exec(
        select(PublicHoliday).where(
            PublicHoliday.holiday_date == shift_date,
            PublicHoliday.state.in_([job.state, NATIONAL_HOLIDAY_STATE]),
        )
    ).first()
    if holiday is not None:
        return DAY_TYPE_PUBLIC_HOLIDAY

    weekday = shift_date.weekday()  # Monday=0 ... Sunday=6
    if weekday == 5:
        return DAY_TYPE_SATURDAY
    if weekday == 6:
        return DAY_TYPE_SUNDAY
    return DAY_TYPE_WEEKDAY


def resolve_pay_rule(session: Session, job_id: int, shift_date: date) -> ResolvedRate:
    rules = session.exec(
        select(JobPayRule).where(
            JobPayRule.job_id == job_id,
            JobPayRule.effective_from <= shift_date,
        )
    ).all()
    applicable = [
        rule for rule in rules if rule.effective_to is None or rule.effective_to >= shift_date
    ]
    if not applicable:
        raise NoApplicableRuleError(
            f"No pay rule found for job_id={job_id} on {shift_date.isoformat()}"
        )
    # Non-overlap is enforced at write time, so there should be exactly one;
    # defensively take the most recently-starting rule if that invariant is ever violated.
    rule = max(applicable, key=lambda r: r.effective_from)

    if rule.rule_type == "preset":
        preset = session.get(PayRatePreset, rule.preset_id)
        if preset is None:
            raise NoApplicableRuleError(
                f"JobPayRule {rule.id} references missing preset_id={rule.preset_id}"
            )
        return ResolvedRate(
            weekday_rate=preset.base_hourly_rate,
            saturday_rate=preset.saturday_rate,
            sunday_rate=preset.sunday_rate,
            public_holiday_rate=preset.public_holiday_rate,
            source_description=f"preset:{preset.name}",
        )

    return ResolvedRate(
        weekday_rate=rule.custom_weekday_rate,
        saturday_rate=rule.custom_saturday_rate,
        sunday_rate=rule.custom_sunday_rate,
        public_holiday_rate=rule.custom_public_holiday_rate,
        source_description=f"custom rule id={rule.id}",
    )


def compute_worked_hours(
    start_time: time, end_time: time, crosses_midnight: bool, unpaid_break_minutes: int
) -> Decimal:
    start_minutes = start_time.hour * 60 + start_time.minute
    end_minutes = end_time.hour * 60 + end_time.minute
    if crosses_midnight:
        total_minutes = (end_minutes + 24 * 60) - start_minutes
    else:
        total_minutes = end_minutes - start_minutes
    worked_minutes = total_minutes - unpaid_break_minutes
    return Decimal(worked_minutes) / Decimal(60)


def _rate_for_day_type(resolved_rate: ResolvedRate, day_type: str) -> Decimal:
    return {
        DAY_TYPE_WEEKDAY: resolved_rate.weekday_rate,
        DAY_TYPE_SATURDAY: resolved_rate.saturday_rate,
        DAY_TYPE_SUNDAY: resolved_rate.sunday_rate,
        DAY_TYPE_PUBLIC_HOLIDAY: resolved_rate.public_holiday_rate,
    }[day_type]


def compute_gross_pay(session: Session, job: Job, shift: Shift) -> PayBreakdown:
    day_type = resolve_day_type(session, job, shift.shift_date, shift.day_type_override)
    resolved_rate = resolve_pay_rule(session, job.id, shift.shift_date)
    hourly_rate = _rate_for_day_type(resolved_rate, day_type)
    worked_hours = compute_worked_hours(
        shift.start_time, shift.end_time, shift.crosses_midnight, shift.unpaid_break_minutes
    )
    gross_pay = worked_hours * hourly_rate
    return PayBreakdown(
        worked_hours=worked_hours,
        day_type=day_type,
        hourly_rate_applied=hourly_rate,
        gross_pay=gross_pay,
        rule_source_description=resolved_rate.source_description,
    )
