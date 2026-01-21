from datetime import datetime

from pydantic import BaseModel


class TaskCreate(BaseModel):
    title: str


class TaskUpdate(BaseModel):
    is_done: bool


class TaskRead(BaseModel):
    id: int
    title: str
    is_done: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ModelStatusRead(BaseModel):
    id: int
    name: str
    archetype: str
    progress: int
    status: str

    class Config:
        from_attributes = True


class ModelStatusUpdate(BaseModel):
    progress: int | None = None
    status: str | None = None


class AccountPlatformRead(BaseModel):
    id: int
    platform: str
    accounts: int
    status: str

    class Config:
        from_attributes = True


class AccountPlatformUpdate(BaseModel):
    accounts: int | None = None
    status: str | None = None
