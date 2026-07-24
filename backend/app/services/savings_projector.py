from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlmodel import Session, select

from app.models.car_loan import CarLoanPayment
from app.models.expense import Expense
from app.models.extra_income import ExtraIncome
from app.models.job import Job
from app.models.savings_goal import SavingsGoal
from app.models.shift import Shift
from app.services import pay_calculator
from app.services.rent_projector import total_rent_paid_between

MIN_WEEKS_REMAINING = Decimal("0.01")


@dataclass
class SavingsProgress:
    net_saved_so_far: Decimal
    weeks_remaining: Decimal
    required_weekly_savings: Decimal


def _total_shift_income(session: Session, start_date: date, end_date: date) -> Decimal:
    shifts = session.exec(
        select(Shift).where(
            Shift.shift_date >= start_date,
            Shift.shift_date <= end_date,
        )
    ).all()
    total = Decimal("0")
    for shift in shifts:
        job = session.get(Job, shift.job_id)
        if job is None:
            continue
        breakdown = pay_calculator.compute_gross_pay(session, job, shift)
        total += breakdown.gross_pay
    return total


def _total_car_loan_payments(session: Session, start_date: date, end_date: date) -> Decimal:
    payments = session.exec(
        select(CarLoanPayment).where(
            CarLoanPayment.payment_date >= start_date,
            CarLoanPayment.payment_date <= end_date,
        )
    ).all()
    return sum((p.amount for p in payments), Decimal("0"))


def _total_expenses(session: Session, start_date: date, end_date: date) -> Decimal:
    expenses = session.exec(
        select(Expense).where(
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
        )
    ).all()
    return sum((e.amount for e in expenses), Decimal("0"))


def _total_extra_income(session: Session, start_date: date, end_date: date) -> Decimal:
    incomes = session.exec(
        select(ExtraIncome).where(
            ExtraIncome.income_date >= start_date,
            ExtraIncome.income_date <= end_date,
        )
    ).all()
    return sum((i.amount for i in incomes), Decimal("0"))


def compute_savings_progress(
    session: Session, goal: SavingsGoal, today: date
) -> SavingsProgress:
    shift_income = _total_shift_income(session, goal.tracking_start_date, today)
    extra_income = _total_extra_income(session, goal.tracking_start_date, today)
    rent_paid = total_rent_paid_between(session, goal.tracking_start_date, today)
    car_loan_paid = _total_car_loan_payments(session, goal.tracking_start_date, today)
    other_expenses = _total_expenses(session, goal.tracking_start_date, today)

    net_saved_so_far = (
        goal.starting_balance
        + shift_income
        + extra_income
        - rent_paid
        - car_loan_paid
        - other_expenses
    )

    days_remaining = (goal.target_date - today).days
    weeks_remaining = Decimal(max(days_remaining, 0)) / Decimal(7)
    if weeks_remaining < MIN_WEEKS_REMAINING:
        weeks_remaining = MIN_WEEKS_REMAINING

    remaining_amount = goal.target_amount - net_saved_so_far
    required_weekly_savings = remaining_amount / weeks_remaining

    return SavingsProgress(
        net_saved_so_far=net_saved_so_far,
        weeks_remaining=weeks_remaining,
        required_weekly_savings=required_weekly_savings,
    )
