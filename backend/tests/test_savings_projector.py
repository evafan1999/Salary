from datetime import date, time
from decimal import Decimal

from sqlmodel import Session

from app.models.car_loan import CarLoan, CarLoanPayment
from app.models.expense import Expense
from app.models.rent_period import RentPayment, RentPeriod
from app.models.savings_goal import SavingsGoal
from app.services.savings_projector import MIN_WEEKS_REMAINING, compute_savings_progress
from tests.test_pay_calculator import make_custom_rule, make_job, make_shift


def test_net_saved_so_far_only_counts_activity_after_tracking_start(session: Session):
    job = make_job(session)
    make_custom_rule(session, job, effective_from=date(2026, 1, 1))

    # Excluded: before tracking_start_date (2026-07-01)
    make_shift(session, job, date(2026, 6, 20), time(9, 0), time(17, 0))  # Saturday, rate=35 -> 280
    # Included: after tracking_start_date, weekday (Friday) -> rate=30 -> 8h*30=240
    make_shift(session, job, date(2026, 7, 10), time(9, 0), time(17, 0))

    rent = RentPeriod(label="Room", amount=Decimal("300"), cycle_days=14, start_date=date(2026, 6, 1))
    session.add(rent)
    session.commit()
    session.refresh(rent)

    session.add(
        RentPayment(
            rent_period_id=rent.id,
            due_date=date(2026, 5, 30),
            paid_date=date(2026, 6, 15),
            amount=Decimal("300"),
        )
    )  # excluded, paid before tracking start
    session.add(
        RentPayment(
            rent_period_id=rent.id,
            due_date=date(2026, 7, 13),
            paid_date=date(2026, 7, 13),
            amount=Decimal("300"),
        )
    )  # included, paid after tracking start

    car_loan = CarLoan(description="Car", total_amount=Decimal("5000"), start_date=date(2026, 1, 1))
    session.add(car_loan)
    session.commit()
    session.refresh(car_loan)

    session.add(
        CarLoanPayment(car_loan_id=car_loan.id, payment_date=date(2026, 6, 15), amount=Decimal("200"))
    )  # excluded, before tracking start
    session.add(
        CarLoanPayment(car_loan_id=car_loan.id, payment_date=date(2026, 7, 5), amount=Decimal("150"))
    )  # included
    session.add(
        Expense(description="Groceries before tracking", amount=Decimal("40"), expense_date=date(2026, 6, 25))
    )  # excluded, before tracking start
    session.add(
        Expense(description="Groceries", amount=Decimal("60"), expense_date=date(2026, 7, 15))
    )  # included
    session.commit()

    goal = SavingsGoal(
        target_amount=Decimal("10000"),
        target_date=date(2027, 1, 1),
        starting_balance=Decimal("1000"),
        tracking_start_date=date(2026, 7, 1),
    )

    today = date(2026, 7, 21)
    progress = compute_savings_progress(session, goal, today)

    # rent paid within [7/1, 7/21]: only the 7/13-paid confirmation -> 300
    # shift income: only the 7/10 weekday shift counts -> 8h * 30/hr = 240
    # car loan payments after tracking start: 150
    # daily expenses after tracking start: 60
    # net = 1000 + 240 - 300 - 150 - 60 = 730
    assert progress.net_saved_so_far == Decimal("730")


def test_required_weekly_savings_matches_remaining_amount_over_weeks(session: Session):
    goal = SavingsGoal(
        target_amount=Decimal("10000"),
        target_date=date(2026, 8, 4),  # exactly 2 weeks after "today" below
        starting_balance=Decimal("2000"),
        tracking_start_date=date(2026, 7, 21),
    )
    today = date(2026, 7, 21)

    progress = compute_savings_progress(session, goal, today)

    assert progress.weeks_remaining == Decimal("2")
    # net_saved_so_far == starting_balance (no shifts/rent/loans in range)
    assert progress.net_saved_so_far == Decimal("2000")
    assert progress.required_weekly_savings == Decimal("4000")  # (10000-2000)/2


def test_past_target_date_clamps_weeks_remaining_and_avoids_division_error(session: Session):
    goal = SavingsGoal(
        target_amount=Decimal("10000"),
        target_date=date(2026, 1, 1),  # already in the past relative to today
        starting_balance=Decimal("0"),
        tracking_start_date=date(2026, 1, 1),
    )
    today = date(2026, 7, 21)

    progress = compute_savings_progress(session, goal, today)

    assert progress.weeks_remaining == MIN_WEEKS_REMAINING
    assert progress.required_weekly_savings > Decimal("0")
