from datetime import date, timedelta
from decimal import Decimal

from sqlmodel import Session, select

from app.models.rent_period import RentPayment, RentPeriod
from app.schemas.rent_period import UpcomingRentDue

_MAX_CYCLES_GUARD = 100_000
_UPCOMING_HORIZON_DAYS = 365


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


def get_next_unpaid_due(
    session: Session, period: RentPeriod, today: date
) -> UpcomingRentDue | None:
    far_future = today + timedelta(days=_UPCOMING_HORIZON_DAYS)
    all_due_dates = _due_dates_in_range(period, period.start_date, far_future)
    if not all_due_dates:
        return None

    paid_due_dates = {
        payment.due_date
        for payment in session.exec(
            select(RentPayment).where(RentPayment.rent_period_id == period.id)
        ).all()
    }
    for due_date in all_due_dates:
        if due_date not in paid_due_dates:
            return UpcomingRentDue(
                rent_period_id=period.id,
                label=period.label,
                amount=period.amount,
                due_date=due_date,
                is_overdue=due_date < today,
            )
    return None


def get_upcoming_rent(session: Session, today: date, limit: int = 5) -> list[UpcomingRentDue]:
    periods = session.exec(
        select(RentPeriod).where(
            (RentPeriod.end_date.is_(None)) | (RentPeriod.end_date >= today)
        )
    ).all()
    upcoming: list[UpcomingRentDue] = []
    for period in periods:
        next_due = get_next_unpaid_due(session, period, today)
        if next_due is not None:
            upcoming.append(next_due)
    upcoming.sort(key=lambda u: u.due_date)
    return upcoming[:limit]


def total_rent_paid_between(session: Session, range_start: date, range_end: date) -> Decimal:
    """Sum of confirmed rent payments actually made within [range_start, range_end],
    keyed by paid_date. This reflects real money spent, not scheduled obligations —
    used for the savings-goal net-saved-so-far calculation.
    """
    payments = session.exec(
        select(RentPayment).where(
            RentPayment.paid_date >= range_start,
            RentPayment.paid_date <= range_end,
        )
    ).all()
    return sum((p.amount for p in payments), Decimal("0"))
