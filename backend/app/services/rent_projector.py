from datetime import date, timedelta
from decimal import Decimal

from sqlmodel import Session, select

from app.models.rent_period import RentPeriod
from app.schemas.rent_period import UpcomingRentDue

_MAX_CYCLES_GUARD = 100_000


def _due_dates_in_range(
    period: RentPeriod, range_start: date, range_end: date
) -> list[date]:
    dates: list[date] = []
    cycle = 0
    while cycle < _MAX_CYCLES_GUARD:
        candidate = period.start_date + timedelta(days=period.cycle_days * cycle)
        if period.end_date is not None and candidate > period.end_date:
            break
        if candidate > range_end:
            break
        if candidate >= range_start:
            dates.append(candidate)
        cycle += 1
    return dates


def next_due_dates(period: RentPeriod, from_date: date, count: int) -> list[date]:
    far_future = from_date + timedelta(days=period.cycle_days * count + 3650)
    all_dates = _due_dates_in_range(period, from_date, far_future)
    return all_dates[:count]


def get_upcoming_rent(session: Session, today: date, limit: int = 5) -> list[UpcomingRentDue]:
    periods = session.exec(
        select(RentPeriod).where(
            (RentPeriod.end_date.is_(None)) | (RentPeriod.end_date >= today)
        )
    ).all()
    upcoming: list[UpcomingRentDue] = []
    for period in periods:
        due_dates = next_due_dates(period, today, count=1)
        for due_date in due_dates:
            upcoming.append(
                UpcomingRentDue(
                    rent_period_id=period.id,
                    label=period.label,
                    amount=period.amount,
                    due_date=due_date,
                )
            )
    upcoming.sort(key=lambda u: u.due_date)
    return upcoming[:limit]


def total_rent_due_between(session: Session, range_start: date, range_end: date) -> Decimal:
    periods = session.exec(select(RentPeriod)).all()
    total = Decimal("0")
    for period in periods:
        due_dates = _due_dates_in_range(period, range_start, range_end)
        total += period.amount * len(due_dates)
    return total
