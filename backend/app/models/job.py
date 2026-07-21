from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class Job(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    employer_type: str = Field(description="'award' or 'cash'")
    state: str = Field(description="2-letter AU state code, e.g. NSW")
    is_active: bool = Field(default=True)
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
