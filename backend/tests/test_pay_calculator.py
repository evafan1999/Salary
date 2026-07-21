from datetime import date, time
from decimal import Decimal

import pytest
from sqlmodel import Session

from app.exceptions import NoApplicableRuleError
from app.models.job import Job
from app.models.job_pay_rule import JobPayRule
from app.models.pay_rate_preset import PayRatePreset
from app.models.public_holiday import PublicHoliday
from app.models.shift import Shift
from app.services import pay_calculator


def make_job(session: Session, state: str = "NSW") -> Job:
    job = Job(name="Test Job", employer_type="award", state=state)
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


def make_custom_rule(
    session: Session,
    job: Job,
    effective_from: date,
    effective_to: date | None = None,
    weekday=Decimal("30"),
    saturday=Decimal("35"),
    sunday=Decimal("40"),
    public_holiday=Decimal("60"),
) -> JobPayRule:
    rule = JobPayRule(
        job_id=job.id,
        rule_type="custom",
        custom_weekday_rate=weekday,
        custom_saturday_rate=saturday,
        custom_sunday_rate=sunday,
        custom_public_holiday_rate=public_holiday,
        effective_from=effective_from,
        effective_to=effective_to,
    )
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


def make_preset_rule(
    session: Session, job: Job, effective_from: date, effective_to: date | None = None
) -> JobPayRule:
    preset = PayRatePreset(
        name="Preset",
        base_hourly_rate=Decimal("25"),
        saturday_rate=Decimal("31.25"),
        sunday_rate=Decimal("37.5"),
        public_holiday_rate=Decimal("50"),
        effective_from=effective_from,
    )
    session.add(preset)
    session.commit()
    session.refresh(preset)

    rule = JobPayRule(
        job_id=job.id,
        rule_type="preset",
        preset_id=preset.id,
        effective_from=effective_from,
        effective_to=effective_to,
    )
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


def make_shift(
    session: Session,
    job: Job,
    shift_date: date,
    start: time,
    end: time,
    crosses_midnight: bool = False,
    unpaid_break_minutes: int = 0,
    day_type_override: str | None = None,
) -> Shift:
    shift = Shift(
        job_id=job.id,
        shift_date=shift_date,
        start_time=start,
        end_time=end,
        crosses_midnight=crosses_midnight,
        unpaid_break_minutes=unpaid_break_minutes,
        day_type_override=day_type_override,
    )
    session.add(shift)
    session.commit()
    session.refresh(shift)
    return shift


def test_weekday_shift_with_custom_rule(session: Session):
    job = make_job(session)
    make_custom_rule(session, job, effective_from=date(2026, 1, 1))
    # 2026-07-20 is a Monday
    shift = make_shift(session, job, date(2026, 7, 20), time(9, 0), time(17, 0))

    breakdown = pay_calculator.compute_gross_pay(session, job, shift)

    assert breakdown.day_type == "weekday"
    assert breakdown.worked_hours == Decimal("8")
    assert breakdown.hourly_rate_applied == Decimal("30")
    assert breakdown.gross_pay == Decimal("240")


def test_saturday_shift_uses_preset_saturday_rate(session: Session):
    job = make_job(session)
    make_preset_rule(session, job, effective_from=date(2026, 1, 1))
    # 2026-07-25 is a Saturday
    shift = make_shift(session, job, date(2026, 7, 25), time(9, 0), time(17, 0))

    breakdown = pay_calculator.compute_gross_pay(session, job, shift)

    assert breakdown.day_type == "saturday"
    assert breakdown.hourly_rate_applied == Decimal("31.25")
    assert breakdown.gross_pay == Decimal("250.00")


def test_sunday_shift_uses_sunday_rate(session: Session):
    job = make_job(session)
    make_custom_rule(session, job, effective_from=date(2026, 1, 1))
    # 2026-07-26 is a Sunday
    shift = make_shift(session, job, date(2026, 7, 26), time(9, 0), time(17, 0))

    breakdown = pay_calculator.compute_gross_pay(session, job, shift)

    assert breakdown.day_type == "sunday"
    assert breakdown.hourly_rate_applied == Decimal("40")


def test_public_holiday_overrides_weekday_calendar_day(session: Session):
    job = make_job(session, state="NSW")
    make_custom_rule(session, job, effective_from=date(2026, 1, 1))
    # 2026-07-21 is a Tuesday, but we mark it as a public holiday for NSW
    session.add(PublicHoliday(state="NSW", holiday_date=date(2026, 7, 21), name="Test Holiday"))
    session.commit()

    shift = make_shift(session, job, date(2026, 7, 21), time(9, 0), time(17, 0))

    breakdown = pay_calculator.compute_gross_pay(session, job, shift)

    assert breakdown.day_type == "public_holiday"
    assert breakdown.hourly_rate_applied == Decimal("60")


def test_national_public_holiday_applies_regardless_of_state(session: Session):
    job = make_job(session, state="QLD")
    make_custom_rule(session, job, effective_from=date(2026, 1, 1))
    session.add(PublicHoliday(state="NAT", holiday_date=date(2026, 12, 25), name="Christmas Day"))
    session.commit()

    shift = make_shift(session, job, date(2026, 12, 25), time(9, 0), time(17, 0))

    breakdown = pay_calculator.compute_gross_pay(session, job, shift)

    assert breakdown.day_type == "public_holiday"


def test_day_type_override_beats_calendar_detection(session: Session):
    job = make_job(session)
    make_custom_rule(session, job, effective_from=date(2026, 1, 1))
    # 2026-07-22 is a plain Wednesday, force it to be treated as public_holiday
    shift = make_shift(
        session,
        job,
        date(2026, 7, 22),
        time(9, 0),
        time(17, 0),
        day_type_override="public_holiday",
    )

    breakdown = pay_calculator.compute_gross_pay(session, job, shift)

    assert breakdown.day_type == "public_holiday"
    assert breakdown.hourly_rate_applied == Decimal("60")


def test_unpaid_break_deducted_from_worked_hours(session: Session):
    job = make_job(session)
    make_custom_rule(session, job, effective_from=date(2026, 1, 1))
    shift = make_shift(
        session, job, date(2026, 7, 20), time(9, 0), time(17, 0), unpaid_break_minutes=30
    )

    breakdown = pay_calculator.compute_gross_pay(session, job, shift)

    assert breakdown.worked_hours == Decimal("7.5")
    assert breakdown.gross_pay == Decimal("225.0")


def test_midnight_crossing_shift_computes_correct_hours(session: Session):
    job = make_job(session)
    make_custom_rule(session, job, effective_from=date(2026, 1, 1))
    shift = make_shift(
        session,
        job,
        date(2026, 7, 20),
        time(22, 0),
        time(2, 0),
        crosses_midnight=True,
    )

    breakdown = pay_calculator.compute_gross_pay(session, job, shift)

    assert breakdown.worked_hours == Decimal("4")
    # Paid at the start-date's day-type rate (2026-07-20 is a Monday -> weekday)
    assert breakdown.day_type == "weekday"
    assert breakdown.gross_pay == Decimal("120")


def test_pay_rule_switches_correctly_across_effective_date_ranges(session: Session):
    job = make_job(session)
    # Old rate valid until end of June 2026, new rate from July 2026 onward (e.g. FY rollover)
    make_custom_rule(
        session, job, effective_from=date(2026, 1, 1), effective_to=date(2026, 6, 30), weekday=Decimal("28")
    )
    make_custom_rule(
        session, job, effective_from=date(2026, 7, 1), effective_to=None, weekday=Decimal("30")
    )

    shift_before = make_shift(session, job, date(2026, 6, 15), time(9, 0), time(17, 0))
    shift_after = make_shift(session, job, date(2026, 7, 15), time(9, 0), time(17, 0))

    breakdown_before = pay_calculator.compute_gross_pay(session, job, shift_before)
    breakdown_after = pay_calculator.compute_gross_pay(session, job, shift_after)

    assert breakdown_before.hourly_rate_applied == Decimal("28")
    assert breakdown_after.hourly_rate_applied == Decimal("30")


def test_no_applicable_rule_raises_clear_error(session: Session):
    job = make_job(session)
    # No JobPayRule created at all
    shift = make_shift(session, job, date(2026, 7, 20), time(9, 0), time(17, 0))

    with pytest.raises(NoApplicableRuleError):
        pay_calculator.compute_gross_pay(session, job, shift)
