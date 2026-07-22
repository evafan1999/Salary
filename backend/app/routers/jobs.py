from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models.job import Job
from app.schemas.job import JobCreate, JobRead, JobUpdate

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.get("", response_model=list[JobRead])
def list_jobs(include_inactive: bool = False, session: Session = Depends(get_session)):
    query = select(Job)
    if not include_inactive:
        query = query.where(Job.is_active == True)  # noqa: E712
    return session.exec(query).all()


@router.post("", response_model=JobRead, status_code=201)
def create_job(payload: JobCreate, session: Session = Depends(get_session)):
    job = Job(**payload.model_dump())
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: int, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}", response_model=JobRead)
def update_job(job_id: int, payload: JobUpdate, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, key, value)
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
def deactivate_job(job_id: int, session: Session = Depends(get_session)):
    job = session.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_active = False
    session.add(job)
    session.commit()
