from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import create_db_and_tables
from app.routers import (
    car_loan,
    dashboard,
    expenses,
    job_pay_rules,
    jobs,
    pay_rate_presets,
    public_holidays,
    rent_periods,
    savings_goal,
    shifts,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Salary Tracker API", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(jobs.router)
app.include_router(pay_rate_presets.router)
app.include_router(job_pay_rules.router)
app.include_router(public_holidays.router)
app.include_router(shifts.router)
app.include_router(rent_periods.router)
app.include_router(car_loan.router)
app.include_router(expenses.router)
app.include_router(savings_goal.router)
app.include_router(dashboard.router)
