from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models.public_holiday import PublicHoliday
from app.schemas.public_holiday import PublicHolidayCreate, PublicHolidayRead

router = APIRouter(prefix="/api/v1/public-holidays", tags=["public-holidays"])


@router.get("", response_model=list[PublicHolidayRead])
def list_public_holidays(
    state: str | None = None, year: int | None = None, session: Session = Depends(get_session)
):
    query = select(PublicHoliday)
    if state is not None:
        query = query.where(PublicHoliday.state == state)
    holidays = session.exec(query).all()
    if year is not None:
        holidays = [h for h in holidays if h.holiday_date.year == year]
    return holidays


@router.post("", response_model=PublicHolidayRead, status_code=201)
def create_public_holiday(payload: PublicHolidayCreate, session: Session = Depends(get_session)):
    holiday = PublicHoliday(**payload.model_dump())
    session.add(holiday)
    session.commit()
    session.refresh(holiday)
    return holiday


@router.post("/bulk", response_model=list[PublicHolidayRead], status_code=201)
def bulk_create_public_holidays(
    payload: list[PublicHolidayCreate], session: Session = Depends(get_session)
):
    holidays = [PublicHoliday(**item.model_dump()) for item in payload]
    session.add_all(holidays)
    session.commit()
    for holiday in holidays:
        session.refresh(holiday)
    return holidays


@router.delete("/{holiday_id}", status_code=204)
def delete_public_holiday(holiday_id: int, session: Session = Depends(get_session)):
    holiday = session.get(PublicHoliday, holiday_id)
    if holiday is None:
        raise HTTPException(status_code=404, detail="Public holiday not found")
    session.delete(holiday)
    session.commit()
