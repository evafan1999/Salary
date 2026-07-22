from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models.rent_period import RentPeriod
from app.schemas.rent_period import RentPeriodCreate, RentPeriodRead, RentPeriodUpdate, UpcomingRentDue
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
    session.delete(period)
    session.commit()
