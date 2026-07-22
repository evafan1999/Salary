from datetime import date
from decimal import Decimal

from sqlmodel import Session

from app.models.rent_period import RentPayment, RentPeriod
from app.services.rent_projector import (
    get_next_unpaid_due,
    get_upcoming_rent,
    next_due_dates,
    total_rent_paid_between,
)


def test_next_due_dates_fortnightly_cycle():
    period = RentPeriod(
        label="Room", amount=Decimal("300"), cycle_days=14, start_date=date(2026, 7, 1)
    )
    dates = next_due_dates(period, from_date=date(2026, 7, 1), count=3)

    assert dates == [date(2026, 7, 1), date(2026, 7, 15), date(2026, 7, 29)]


def test_total_rent_paid_between_sums_confirmed_payments_by_paid_date(session: Session):
    period = RentPeriod(
        label="Room", amount=Decimal("300"), cycle_days=14, start_date=date(2026, 1, 1)
    )
    session.add(period)
    session.commit()
    session.refresh(period)

    # Paid on time
    session.add(
        RentPayment(
            rent_period_id=period.id,
            due_date=date(2026, 1, 1),
            paid_date=date(2026, 1, 1),
            amount=Decimal("300"),
        )
    )
    # Paid late, but paid_date still falls in the query window
    session.add(
        RentPayment(
            rent_period_id=period.id,
            due_date=date(2026, 1, 15),
            paid_date=date(2026, 2, 5),
            amount=Decimal("300"),
        )
    )
    session.commit()

    total = total_rent_paid_between(session, date(2026, 1, 1), date(2026, 1, 31))

    # Only the 1/1 payment's paid_date falls within Jan; the late one was paid in Feb.
    assert total == Decimal("300")


def test_next_unpaid_due_skips_confirmed_dates(session: Session):
    period = RentPeriod(
        label="Room", amount=Decimal("300"), cycle_days=7, start_date=date(2026, 7, 1)
    )
    session.add(period)
    session.commit()
    session.refresh(period)

    session.add(
        RentPayment(
            rent_period_id=period.id,
            due_date=date(2026, 7, 1),
            paid_date=date(2026, 7, 1),
            amount=Decimal("300"),
        )
    )
    session.commit()

    next_due = get_next_unpaid_due(session, period, today=date(2026, 7, 3))

    assert next_due is not None
    assert next_due.due_date == date(2026, 7, 8)
    assert next_due.is_overdue is False


def test_next_unpaid_due_flags_overdue_when_in_the_past(session: Session):
    period = RentPeriod(
        label="Room", amount=Decimal("300"), cycle_days=14, start_date=date(2026, 7, 1)
    )
    session.add(period)
    session.commit()
    session.refresh(period)

    next_due = get_next_unpaid_due(session, period, today=date(2026, 7, 21))

    assert next_due is not None
    assert next_due.due_date == date(2026, 7, 1)
    assert next_due.is_overdue is True


def test_moving_house_only_surfaces_currently_active_period(session: Session):
    old_period = RentPeriod(
        label="Old place",
        amount=Decimal("300"),
        cycle_days=14,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 6, 30),
    )
    new_period = RentPeriod(
        label="New place",
        amount=Decimal("450"),
        cycle_days=7,
        start_date=date(2026, 7, 1),
    )
    session.add(old_period)
    session.add(new_period)
    session.commit()

    upcoming = get_upcoming_rent(session, today=date(2026, 7, 21), limit=5)

    assert len(upcoming) == 1
    assert upcoming[0].label == "New place"
    assert upcoming[0].amount == Decimal("450")
