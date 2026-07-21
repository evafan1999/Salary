from pydantic import BaseModel


class JobCreate(BaseModel):
    name: str
    employer_type: str
    state: str
    notes: str | None = None


class JobUpdate(BaseModel):
    name: str | None = None
    employer_type: str | None = None
    state: str | None = None
    is_active: bool | None = None
    notes: str | None = None


class JobRead(BaseModel):
    id: int
    name: str
    employer_type: str
    state: str
    is_active: bool
    notes: str | None
