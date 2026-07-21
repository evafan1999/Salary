from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import verify_token
from app.db import get_session
from app.models.savings_goal import SavingsGoal
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalRead, SavingsGoalUpdate
from app.services.savings_projector import compute_savings_progress

router = APIRouter(
    prefix="/api/v1/savings-goal", tags=["savings-goal"], dependencies=[Depends(verify_token)]
)


def _to_read(session: Session, goal: SavingsGoal) -> SavingsGoalRead:
    progress = compute_savings_progress(session, goal, date.today())
    return SavingsGoalRead(
        id=goal.id,
        target_amount=goal.target_amount,
        target_date=goal.target_date,
        starting_balance=goal.starting_balance,
        tracking_start_date=goal.tracking_start_date,
        is_active=goal.is_active,
        notes=goal.notes,
        net_saved_so_far=progress.net_saved_so_far,
        weeks_remaining=progress.weeks_remaining,
        required_weekly_savings=progress.required_weekly_savings,
    )


@router.get("", response_model=SavingsGoalRead | None)
def get_active_goal(session: Session = Depends(get_session)):
    goal = session.exec(select(SavingsGoal).where(SavingsGoal.is_active == True)).first()  # noqa: E712
    if goal is None:
        return None
    return _to_read(session, goal)


@router.post("", response_model=SavingsGoalRead, status_code=201)
def create_goal(payload: SavingsGoalCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(SavingsGoal).where(SavingsGoal.is_active == True)).all()  # noqa: E712
    for goal in existing:
        goal.is_active = False
        session.add(goal)
    new_goal = SavingsGoal(**payload.model_dump(), is_active=True)
    session.add(new_goal)
    session.commit()
    session.refresh(new_goal)
    return _to_read(session, new_goal)


@router.patch("/{goal_id}", response_model=SavingsGoalRead)
def update_goal(goal_id: int, payload: SavingsGoalUpdate, session: Session = Depends(get_session)):
    goal = session.get(SavingsGoal, goal_id)
    if goal is None:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return _to_read(session, goal)
