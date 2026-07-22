from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.models.job import Job
from app.models.savings_goal import SavingsGoal
from app.models.shift import Shift
from app.schemas.dashboard import DashboardSummary, JobEarnings
from app.services import pay_calculator
from app.services.rent_projector import get_upcoming_rent
from app.routers.car_loan import _to_car_loan_read
from app.routers.savings_goal import _to_read as savings_goal_to_read
from app.models.car_loan import CarLoan

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


def _current_week_range(today: date) -> tuple[date, date]:
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=6)
    return start, end


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(session: Session = Depends(get_session)):
    today = date.today()
    period_start, period_end = _current_week_range(today)

    shifts = session.exec(
        select(Shift).where(
            Shift.shift_date >= period_start,
            Shift.shift_date <= period_end,
        )
    ).all()

    earnings_by_job: dict[int, JobEarnings] = {}
    for shift in shifts:
        job = session.get(Job, shift.job_id)
        if job is None:
            continue
        breakdown = pay_calculator.compute_gross_pay(session, job, shift)
        if job.id not in earnings_by_job:
            earnings_by_job[job.id] = JobEarnings(
                job_id=job.id, job_name=job.name, gross_pay=Decimal("0")
            )
        earnings_by_job[job.id].gross_pay += breakdown.gross_pay

    total_earnings = sum((e.gross_pay for e in earnings_by_job.values()), Decimal("0"))

    upcoming_rent = get_upcoming_rent(session, today, limit=5)

    car_loans = session.exec(select(CarLoan)).all()
    car_loan_reads = [_to_car_loan_read(session, loan) for loan in car_loans]

    active_goal = session.exec(
        select(SavingsGoal).where(SavingsGoal.is_active == True)  # noqa: E712
    ).first()
    savings_goal_read = savings_goal_to_read(session, active_goal) if active_goal else None

    return DashboardSummary(
        current_period_start=period_start.isoformat(),
        current_period_end=period_end.isoformat(),
        earnings_by_job=list(earnings_by_job.values()),
        total_current_period_earnings=total_earnings,
        upcoming_rent=upcoming_rent,
        car_loans=car_loan_reads,
        savings_goal=savings_goal_read,
    )
