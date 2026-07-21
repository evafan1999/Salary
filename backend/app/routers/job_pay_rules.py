from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import verify_token
from app.db import get_session
from app.models.job import Job
from app.models.job_pay_rule import JobPayRule
from app.schemas.job_pay_rule import JobPayRuleCreate, JobPayRuleRead, JobPayRuleUpdate

router = APIRouter(prefix="/api/v1", tags=["job-pay-rules"], dependencies=[Depends(verify_token)])


def _ranges_overlap(
    a_start: date, a_end: date | None, b_start: date, b_end: date | None
) -> bool:
    effective_a_end = a_end or date.max
    effective_b_end = b_end or date.max
    return a_start <= effective_b_end and b_start <= effective_a_end


def _assert_no_overlap(
    session: Session, job_id: int, effective_from: date, effective_to: date | None,
    exclude_rule_id: int | None = None,
) -> None:
    existing_rules = session.exec(
        select(JobPayRule).where(JobPayRule.job_id == job_id)
    ).all()
    for rule in existing_rules:
        if exclude_rule_id is not None and rule.id == exclude_rule_id:
            continue
        if _ranges_overlap(effective_from, effective_to, rule.effective_from, rule.effective_to):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Effective date range overlaps existing JobPayRule id={rule.id} "
                    f"({rule.effective_from} to {rule.effective_to or 'ongoing'})"
                ),
            )


@router.get("/jobs/{job_id}/pay-rules", response_model=list[JobPayRuleRead])
def list_pay_rules(job_id: int, session: Session = Depends(get_session)):
    if session.get(Job, job_id) is None:
        raise HTTPException(status_code=404, detail="Job not found")
    rules = session.exec(
        select(JobPayRule).where(JobPayRule.job_id == job_id).order_by(JobPayRule.effective_from)
    ).all()
    return rules


@router.post("/jobs/{job_id}/pay-rules", response_model=JobPayRuleRead, status_code=201)
def create_pay_rule(
    job_id: int, payload: JobPayRuleCreate, session: Session = Depends(get_session)
):
    if session.get(Job, job_id) is None:
        raise HTTPException(status_code=404, detail="Job not found")
    _assert_no_overlap(session, job_id, payload.effective_from, payload.effective_to)
    rule = JobPayRule(job_id=job_id, **payload.model_dump())
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.patch("/pay-rules/{rule_id}", response_model=JobPayRuleRead)
def update_pay_rule(
    rule_id: int, payload: JobPayRuleUpdate, session: Session = Depends(get_session)
):
    rule = session.get(JobPayRule, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="JobPayRule not found")
    updates = payload.model_dump(exclude_unset=True)
    new_from = updates.get("effective_from", rule.effective_from)
    new_to = updates.get("effective_to", rule.effective_to)
    if "effective_from" in updates or "effective_to" in updates:
        _assert_no_overlap(session, rule.job_id, new_from, new_to, exclude_rule_id=rule.id)
    for key, value in updates.items():
        setattr(rule, key, value)
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.delete("/pay-rules/{rule_id}", status_code=204)
def delete_pay_rule(rule_id: int, session: Session = Depends(get_session)):
    rule = session.get(JobPayRule, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="JobPayRule not found")
    session.delete(rule)
    session.commit()
