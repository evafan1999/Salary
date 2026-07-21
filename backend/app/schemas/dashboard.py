from decimal import Decimal

from pydantic import BaseModel

from app.schemas.car_loan import CarLoanRead
from app.schemas.rent_period import UpcomingRentDue
from app.schemas.savings_goal import SavingsGoalRead


class JobEarnings(BaseModel):
    job_id: int
    job_name: str
    gross_pay: Decimal


class DashboardSummary(BaseModel):
    current_period_start: str
    current_period_end: str
    earnings_by_job: list[JobEarnings]
    total_current_period_earnings: Decimal
    upcoming_rent: list[UpcomingRentDue]
    car_loans: list[CarLoanRead]
    savings_goal: SavingsGoalRead | None
