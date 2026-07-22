from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models.rent_period import RentPayment, RentPeriod
from app.schemas.rent_period import (
    RentPaymentCreate,
    RentPaymentRead,
    RentPeriodCreate,
    RentPeriodRead,
    RentPeriodUpdate,
    UpcomingRentDue,
)
from app.services.rent_projector import get_upcoming_rent

router = APIRouter(prefix="/api/v1/rent-periods", tags=["rent-periods"])


@router.get("", response_model=list[RentPeriodRead])
def list_rent_periods(session: Session = Depends(get_session)):
    return session.exec(select(RentPeriod)).all()


@router.post("", response_model=RentPeriodRead, status_code=201)
def create_rent_period(payload: RentPeriodCreate, session: Session = Depends(get_session)):
    period = RentPeriod(**payload.model_dump())
    session.add(period)
    session.commit()
    session.refresh(period)
    return period


@router.get("/upcoming", response_model=list[UpcomingRentDue])
def upcoming_rent(limit: int = 5, session: Session = Depends(get_session)):
    return get_upcoming_rent(session, date.today(), limit=limit)


@router.patch("/{period_id}", response_model=RentPeriodRead)
def update_rent_period(
    period_id: int, payload: RentPeriodUpdate, session: Session = Depends(get_session)
):
    period = session.get(RentPeriod, period_id)
    if period is None:
        raise HTTPException(status_code=404, detail="Rent period not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(period, key, value)
    session.add(period)
    session.commit()
    session.refresh(period)
    return period


@router.delete("/{period_id}", status_code=204)
def delete_rent_period(period_id: int, session: Session = Depends(get_session)):
    period = session.get(RentPeriod, period_id)
    if period is None:
        raise HTTPException(status_code=404, detail="Rent period not found")
    payments = session.exec(
        select(RentPayment).where(RentPayment.rent_period_id == period_id)
    ).all()
    for payment in payments:
        session.delete(payment)
    session.delete(period)
    session.commit()


@router.get("/{period_id}/payments", response_model=list[RentPaymentRead])
def list_rent_payments(period_id: int, session: Session = Depends(get_session)):
    if session.get(RentPeriod, period_id) is None:
        raise HTTPException(status_code=404, detail="Rent period not found")
    return session.exec(
        select(RentPayment)
        .where(RentPayment.rent_period_id == period_id)
        .order_by(RentPayment.due_date)
    ).all()


@router.post("/{period_id}/payments", response_model=RentPaymentRead, status_code=201)
def create_rent_payment(
    period_id: int, payload: RentPaymentCreate, session: Session = Depends(get_session)
):
    if session.get(RentPeriod, period_id) is None:
        raise HTTPException(status_code=404, detail="Rent period not found")
    existing = session.exec(
        select(RentPayment).where(
            RentPayment.rent_period_id == period_id,
            RentPayment.due_date == payload.due_date,
        )
    ).first()
    if existing is not None:
        raise HTTPException(
            status_code=409, detail="This due date has already been confirmed as paid"
        )
    payment = RentPayment(rent_period_id=period_id, **payload.model_dump())
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


@router.delete("/payments/{payment_id}", status_code=204)
def delete_rent_payment(payment_id: int, session: Session = Depends(get_session)):
    payment = session.get(RentPayment, payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Rent payment not found")
    session.delete(payment)
    session.commit()
