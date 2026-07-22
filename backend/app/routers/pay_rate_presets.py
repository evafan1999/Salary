from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models.job_pay_rule import JobPayRule
from app.models.pay_rate_preset import PayRatePreset
from app.schemas.pay_rate_preset import (
    PayRatePresetCreate,
    PayRatePresetRead,
    PayRatePresetUpdate,
)

router = APIRouter(
    prefix="/api/v1/pay-rate-presets",
    tags=["pay-rate-presets"],
)


@router.get("", response_model=list[PayRatePresetRead])
def list_presets(session: Session = Depends(get_session)):
    return session.exec(select(PayRatePreset)).all()


@router.post("", response_model=PayRatePresetRead, status_code=201)
def create_preset(payload: PayRatePresetCreate, session: Session = Depends(get_session)):
    preset = PayRatePreset(**payload.model_dump())
    session.add(preset)
    session.commit()
    session.refresh(preset)
    return preset


@router.get("/{preset_id}", response_model=PayRatePresetRead)
def get_preset(preset_id: int, session: Session = Depends(get_session)):
    preset = session.get(PayRatePreset, preset_id)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")
    return preset


@router.patch("/{preset_id}", response_model=PayRatePresetRead)
def update_preset(
    preset_id: int, payload: PayRatePresetUpdate, session: Session = Depends(get_session)
):
    preset = session.get(PayRatePreset, preset_id)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(preset, key, value)
    session.add(preset)
    session.commit()
    session.refresh(preset)
    return preset


@router.delete("/{preset_id}", status_code=204)
def delete_preset(preset_id: int, session: Session = Depends(get_session)):
    preset = session.get(PayRatePreset, preset_id)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")
    in_use = session.exec(
        select(JobPayRule).where(JobPayRule.preset_id == preset_id)
    ).first()
    if in_use is not None:
        raise HTTPException(
            status_code=409,
            detail="Preset is still referenced by at least one JobPayRule",
        )
    session.delete(preset)
    session.commit()
