from datetime import UTC, date, datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class CarLoan(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    description: str = Field(description="e.g. 'Toyota Corolla from Wei'")
    total_amount: Decimal
    start_date: date
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CarLoanPayment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    car_loan_id: int = Field(foreign_key="carloan.id")
    payment_date: date
    amount: Decimal
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
