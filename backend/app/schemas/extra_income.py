from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ExtraIncomeCreate(BaseModel):
    description: str
    amount: Decimal
    income_date: date
    notes: str | None = None


class ExtraIncomeUpdate(BaseModel):
    description: str | None = None
    amount: Decimal | None = None
    income_date: date | None = None
    notes: str | None = None


class ExtraIncomeRead(BaseModel):
    id: int
    description: str
    amount: Decimal
    income_date: date
    notes: str | None
