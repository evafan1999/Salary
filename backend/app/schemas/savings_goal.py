from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class SavingsGoalCreate(BaseModel):
    target_amount: Decimal
    target_date: date
    starting_balance: Decimal = Decimal("0")
    tracking_start_date: date
    notes: str | None = None


class SavingsGoalUpdate(BaseModel):
    target_amount: Decimal | None = None
    target_date: date | None = None
    starting_balance: Decimal | None = None
    tracking_start_date: date | None = None
    notes: str | None = None


class SavingsGoalRead(BaseModel):
    id: int
    target_amount: Decimal
    target_date: date
    starting_balance: Decimal
    tracking_start_date: date
    is_active: bool
    notes: str | None
    net_saved_so_far: Decimal
    weeks_remaining: Decimal
    required_weekly_savings: Decimal
