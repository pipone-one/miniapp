from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# --- Niches ---

class NicheBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "folder"
    is_active: bool = True


class NicheCreate(NicheBase):
    pass


class NicheRead(NicheBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Tasks ---

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: str = "one_time"  # one_time, recurring
    frequency: Optional[str] = None  # daily, weekly
    scheduled_time: Optional[str] = None  # HH:MM
    week_days: Optional[str] = None
    content_link: Optional[str] = None
    niche_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_archived: Optional[bool] = None


class TaskRead(TaskBase):
    id: int
    is_archived: bool
    created_at: datetime
    niche: Optional[NicheRead] = None
    is_done_today: bool = False  # Computed field

    model_config = ConfigDict(from_attributes=True)


# --- Logs ---

class TaskLogCreate(BaseModel):
    task_id: int
    status: str
    note: Optional[str] = None
    date: str  # YYYY-MM-DD


class TaskLogRead(TaskLogCreate):
    id: int
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Legacy Support ---

class ModelStatusBase(BaseModel):
    name: str
    archetype: str
    progress: int = 0
    status: str = "Standby"


class ModelStatusRead(ModelStatusBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ModelStatusUpdate(BaseModel):
    progress: Optional[int] = None
    status: Optional[str] = None


class AccountPlatformBase(BaseModel):
    platform: str
    accounts: int = 0
    status: str = "Standby"


class AccountPlatformRead(AccountPlatformBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AccountPlatformUpdate(BaseModel):
    accounts: Optional[int] = None
    status: Optional[str] = None
