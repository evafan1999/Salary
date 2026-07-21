from datetime import UTC, date, datetime

from sqlmodel import Field, SQLModel, UniqueConstraint


class PublicHoliday(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("state", "holiday_date"),)

    id: int | None = Field(default=None, primary_key=True)
    state: str = Field(description="2-letter AU state code, or 'NAT' for national holidays")
    holiday_date: date
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
