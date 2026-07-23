from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class CarLoanCreate(BaseModel):
    description: str
    total_amount: Decimal
    start_date: date
    notes: str | None = None


class CarLoanUpdate(BaseModel):
    description: str | None = None
    total_amount: Decimal | None = None
    start_date: date | None = None
    notes: str | None = None


class CarLoanRead(BaseModel):
    id: int
    description: str
    total_amount: Decimal
    start_date: date
    notes: str | None
    paid_to_date: Decimal
    remaining_balance: Decimal


class CarLoanPaymentCreate(BaseModel):
    payment_date: date
    amount: Decimal
    notes: str | None = None


class CarLoanPaymentUpdate(BaseModel):
    payment_date: date | None = None
    amount: Decimal | None = None
    notes: str | None = None


class CarLoanPaymentRead(BaseModel):
    id: int
    car_loan_id: int
    payment_date: date
    amount: Decimal
    notes: str | None
