from datetime import date

from pydantic import BaseModel


class PublicHolidayCreate(BaseModel):
    state: str
    holiday_date: date
    name: str


class PublicHolidayRead(BaseModel):
    id: int
    state: str
    holiday_date: date
    name: str
