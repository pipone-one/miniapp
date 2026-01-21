from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class TaskType(str, Enum):
    ONE_TIME = "one_time"
    RECURRING = "recurring"


class TaskStatus(str, Enum):
    PENDING = "pending"
    DONE = "done"
    MISSED = "missed"
    SKIPPED = "skipped"


class Niche(Base):
    __tablename__ = "niches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(7), default="#3B82F6")  # HEX color
    icon: Mapped[str] = mapped_column(String(32), default="folder")  # Lucide icon name
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="niche", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profile"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[str] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD
    
    # Inventory & Achievements (JSON stored as Text for SQLite simplicity)
    inventory: Mapped[str] = mapped_column(Text, default="[]")  # List of item IDs
    achievements: Mapped[str] = mapped_column(Text, default="[]")  # List of achievement IDs
    telegram_chat_id: Mapped[str] = mapped_column(String(32), nullable=True)  # Telegram Chat ID



class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    niche_id: Mapped[int] = mapped_column(Integer, ForeignKey("niches.id"), nullable=True)
    
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Task Configuration
    task_type: Mapped[str] = mapped_column(String(20), default=TaskType.ONE_TIME)
    frequency: Mapped[str] = mapped_column(String(20), nullable=True)  # daily, weekly, etc.
    scheduled_time: Mapped[str] = mapped_column(String(5), nullable=True)  # HH:MM
    week_days: Mapped[str] = mapped_column(String(20), nullable=True)  # 1,3,5 for Mon,Wed,Fri
    
    # Content (Context)
    content_link: Mapped[str] = mapped_column(String, nullable=True)
    
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    niche = relationship("Niche", back_populates="tasks")
    logs = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")


class TaskLog(Base):
    __tablename__ = "task_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id"))
    
    status: Mapped[str] = mapped_column(String(20), default=TaskStatus.PENDING)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    note: Mapped[str] = mapped_column(Text, nullable=True)  # Why missed? or Reflection
    
    date: Mapped[str] = mapped_column(String(10), index=True)  # YYYY-MM-DD for stats aggregation

    # Relationships
    task = relationship("Task", back_populates="logs")


# --- Legacy / Extensions (Keeping these for compatibility/future use) ---

class ModelStatus(Base):
    __tablename__ = "model_statuses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    archetype: Mapped[str] = mapped_column(String(64), nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(24), default="Standby")


class BotUser(Base):
    __tablename__ = "bot_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    telegram_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    username: Mapped[str] = mapped_column(String(64), nullable=True)
    first_name: Mapped[str] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AccountPlatform(Base):
    __tablename__ = "account_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    platform: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    accounts: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(24), default="Standby")
