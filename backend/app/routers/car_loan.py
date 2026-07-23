from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models.car_loan import CarLoan, CarLoanPayment
from app.schemas.car_loan import (
    CarLoanCreate,
    CarLoanPaymentCreate,
    CarLoanPaymentRead,
    CarLoanPaymentUpdate,
    CarLoanRead,
    CarLoanUpdate,
)

router = APIRouter(prefix="/api/v1/car-loans", tags=["car-loans"])


def _to_car_loan_read(session: Session, loan: CarLoan) -> CarLoanRead:
    payments = session.exec(
        select(CarLoanPayment).where(CarLoanPayment.car_loan_id == loan.id)
    ).all()
    paid_to_date = sum((p.amount for p in payments), Decimal("0"))
    return CarLoanRead(
        id=loan.id,
        description=loan.description,
        total_amount=loan.total_amount,
        start_date=loan.start_date,
        notes=loan.notes,
        paid_to_date=paid_to_date,
        remaining_balance=loan.total_amount - paid_to_date,
    )


@router.get("", response_model=list[CarLoanRead])
def list_car_loans(session: Session = Depends(get_session)):
    loans = session.exec(select(CarLoan)).all()
    return [_to_car_loan_read(session, loan) for loan in loans]


@router.post("", response_model=CarLoanRead, status_code=201)
def create_car_loan(payload: CarLoanCreate, session: Session = Depends(get_session)):
    loan = CarLoan(**payload.model_dump())
    session.add(loan)
    session.commit()
    session.refresh(loan)
    return _to_car_loan_read(session, loan)


@router.patch("/{loan_id}", response_model=CarLoanRead)
def update_car_loan(loan_id: int, payload: CarLoanUpdate, session: Session = Depends(get_session)):
    loan = session.get(CarLoan, loan_id)
    if loan is None:
        raise HTTPException(status_code=404, detail="Car loan not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(loan, key, value)
    session.add(loan)
    session.commit()
    session.refresh(loan)
    return _to_car_loan_read(session, loan)


@router.get("/{loan_id}/payments", response_model=list[CarLoanPaymentRead])
def list_car_loan_payments(loan_id: int, session: Session = Depends(get_session)):
    if session.get(CarLoan, loan_id) is None:
        raise HTTPException(status_code=404, detail="Car loan not found")
    return session.exec(
        select(CarLoanPayment).where(CarLoanPayment.car_loan_id == loan_id)
    ).all()


@router.post("/{loan_id}/payments", response_model=CarLoanPaymentRead, status_code=201)
def create_car_loan_payment(
    loan_id: int, payload: CarLoanPaymentCreate, session: Session = Depends(get_session)
):
    if session.get(CarLoan, loan_id) is None:
        raise HTTPException(status_code=404, detail="Car loan not found")
    payment = CarLoanPayment(car_loan_id=loan_id, **payload.model_dump())
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


@router.patch("/payments/{payment_id}", response_model=CarLoanPaymentRead)
def update_car_loan_payment(
    payment_id: int, payload: CarLoanPaymentUpdate, session: Session = Depends(get_session)
):
    payment = session.get(CarLoanPayment, payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Car loan payment not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(payment, key, value)
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


@router.delete("/payments/{payment_id}", status_code=204)
def delete_car_loan_payment(payment_id: int, session: Session = Depends(get_session)):
    payment = session.get(CarLoanPayment, payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Car loan payment not found")
    session.delete(payment)
    session.commit()
