from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    description: str
    amount: Decimal
    expense_date: date
    notes: str | None = None


class ExpenseUpdate(BaseModel):
    description: str | None = None
    amount: Decimal | None = None
    expense_date: date | None = None
    notes: str | None = None


class ExpenseRead(BaseModel):
    id: int
    description: str
    amount: Decimal
    expense_date: date
    notes: str | None
