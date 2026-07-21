from datetime import date
from decimal import Decimal

from sqlmodel import Session

from app.models.rent_period import RentPeriod
from app.services.rent_projector import get_upcoming_rent, next_due_dates, total_rent_due_between


def test_next_due_dates_fortnightly_cycle():
    period = RentPeriod(
        label="Room", amount=Decimal("300"), cycle_days=14, start_date=date(2026, 7, 1)
    )
    dates = next_due_dates(period, from_date=date(2026, 7, 1), count=3)

    assert dates == [date(2026, 7, 1), date(2026, 7, 15), date(2026, 7, 29)]


def test_closed_rent_period_does_not_generate_dates_past_its_end(session: Session):
    period = RentPeriod(
        label="Old place",
        amount=Decimal("300"),
        cycle_days=14,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 2, 1),
    )
    session.add(period)
    session.commit()

    total = total_rent_due_between(session, date(2026, 1, 1), date(2026, 12, 31))

    # Due dates within Jan 1 - Feb 1: 1/1, 1/15, 1/29 (2/12 would be next but is after end_date)
    assert total == Decimal("300") * 3


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
