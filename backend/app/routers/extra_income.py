from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models.extra_income import ExtraIncome
from app.schemas.extra_income import ExtraIncomeCreate, ExtraIncomeRead, ExtraIncomeUpdate

router = APIRouter(prefix="/api/v1/extra-income", tags=["extra-income"])


@router.get("", response_model=list[ExtraIncomeRead])
def list_extra_income(
    start_date: date | None = None,
    end_date: date | None = None,
    session: Session = Depends(get_session),
):
    query = select(ExtraIncome)
    if start_date is not None:
        query = query.where(ExtraIncome.income_date >= start_date)
    if end_date is not None:
        query = query.where(ExtraIncome.income_date <= end_date)
    return session.exec(query.order_by(ExtraIncome.income_date.desc())).all()


@router.post("", response_model=ExtraIncomeRead, status_code=201)
def create_extra_income(payload: ExtraIncomeCreate, session: Session = Depends(get_session)):
    income = ExtraIncome(**payload.model_dump())
    session.add(income)
    session.commit()
    session.refresh(income)
    return income


@router.patch("/{income_id}", response_model=ExtraIncomeRead)
def update_extra_income(
    income_id: int, payload: ExtraIncomeUpdate, session: Session = Depends(get_session)
):
    income = session.get(ExtraIncome, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Extra income not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(income, key, value)
    session.add(income)
    session.commit()
    session.refresh(income)
    return income


@router.delete("/{income_id}", status_code=204)
def delete_extra_income(income_id: int, session: Session = Depends(get_session)):
    income = session.get(ExtraIncome, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Extra income not found")
    session.delete(income)
    session.commit()
