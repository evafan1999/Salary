from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import verify_token
from app.db import get_session
from app.exceptions import NoApplicableRuleError
from app.models.job import Job
from app.models.shift import Shift
from app.schemas.shift import PayBreakdown, ShiftCreate, ShiftRead, ShiftUpdate
from app.services import pay_calculator

router = APIRouter(prefix="/api/v1/shifts", tags=["shifts"], dependencies=[Depends(verify_token)])


def _get_job_or_404(session: Session, job_id: int) -> Job:
    job = session.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _to_shift_read(session: Session, job: Job, shift: Shift) -> ShiftRead:
    try:
        breakdown = pay_calculator.compute_gross_pay(session, job, shift)
    except NoApplicableRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return ShiftRead(
        id=shift.id,
        job_id=shift.job_id,
        shift_date=shift.shift_date,
        start_time=shift.start_time,
        end_time=shift.end_time,
        crosses_midnight=shift.crosses_midnight,
        unpaid_break_minutes=shift.unpaid_break_minutes,
        day_type_override=shift.day_type_override,
        notes=shift.notes,
        worked_hours=breakdown.worked_hours,
        resolved_day_type=breakdown.day_type,
        gross_pay=breakdown.gross_pay,
    )


@router.get("", response_model=list[ShiftRead])
def list_shifts(
    start_date: date | None = None,
    end_date: date | None = None,
    job_id: int | None = None,
    session: Session = Depends(get_session),
):
    query = select(Shift)
    if start_date is not None:
        query = query.where(Shift.shift_date >= start_date)
    if end_date is not None:
        query = query.where(Shift.shift_date <= end_date)
    if job_id is not None:
        query = query.where(Shift.job_id == job_id)
    shifts = session.exec(query.order_by(Shift.shift_date)).all()

    result = []
    for shift in shifts:
        job = session.get(Job, shift.job_id)
        if job is None:
            continue
        result.append(_to_shift_read(session, job, shift))
    return result


@router.post("", response_model=ShiftRead, status_code=201)
def create_shift(payload: ShiftCreate, session: Session = Depends(get_session)):
    job = _get_job_or_404(session, payload.job_id)
    shift = Shift(**payload.model_dump())
    # Validate the pay rule resolves before persisting, so we never save an uncalculable shift.
    try:
        pay_calculator.compute_gross_pay(session, job, shift)
    except NoApplicableRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    session.add(shift)
    session.commit()
    session.refresh(shift)
    return _to_shift_read(session, job, shift)


@router.get("/{shift_id}", response_model=ShiftRead)
def get_shift(shift_id: int, session: Session = Depends(get_session)):
    shift = session.get(Shift, shift_id)
    if shift is None:
        raise HTTPException(status_code=404, detail="Shift not found")
    job = _get_job_or_404(session, shift.job_id)
    return _to_shift_read(session, job, shift)


@router.patch("/{shift_id}", response_model=ShiftRead)
def update_shift(shift_id: int, payload: ShiftUpdate, session: Session = Depends(get_session)):
    shift = session.get(Shift, shift_id)
    if shift is None:
        raise HTTPException(status_code=404, detail="Shift not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(shift, key, value)
    job = _get_job_or_404(session, shift.job_id)
    try:
        pay_calculator.compute_gross_pay(session, job, shift)  # validate before committing
    except NoApplicableRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    session.add(shift)
    session.commit()
    session.refresh(shift)
    return _to_shift_read(session, job, shift)


@router.delete("/{shift_id}", status_code=204)
def delete_shift(shift_id: int, session: Session = Depends(get_session)):
    shift = session.get(Shift, shift_id)
    if shift is None:
        raise HTTPException(status_code=404, detail="Shift not found")
    session.delete(shift)
    session.commit()


@router.get("/{shift_id}/pay-breakdown", response_model=PayBreakdown)
def get_pay_breakdown(shift_id: int, session: Session = Depends(get_session)):
    shift = session.get(Shift, shift_id)
    if shift is None:
        raise HTTPException(status_code=404, detail="Shift not found")
    job = _get_job_or_404(session, shift.job_id)
    try:
        return pay_calculator.compute_gross_pay(session, job, shift)
    except NoApplicableRuleError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
