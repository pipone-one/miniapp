from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _build_db_url() -> str:
    return f"sqlite+aiosqlite:///{settings.sqlite_path}"


class Base(DeclarativeBase):
    pass


engine = create_async_engine(_build_db_url(), echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    import app.models  # noqa: F401

    Path(settings.sqlite_path).parent.mkdir(parents=True, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_defaults() -> None:
    from sqlalchemy import select

    from app.models import AccountPlatform, ModelStatus, Niche

    async with SessionLocal() as session:
        # Seed Niches
        niches_result = await session.execute(select(Niche))
        if not niches_result.scalars().first():
            session.add_all(
                [
                    Niche(name="Спорт", icon="dumbbell", color="#EF4444", description="Тренировки и здоровье"),
                    Niche(name="Работа", icon="briefcase", color="#3B82F6", description="Проекты и бизнес"),
                    Niche(name="Отдых", icon="coffee", color="#10B981", description="Релакс и хобби"),
                ]
            )

        # Legacy Seeds
        models_result = await session.execute(select(ModelStatus))
        if not models_result.scalars().first():
            session.add_all(
                [
                    ModelStatus(name="MIA", archetype="Office / Gamer", progress=68, status="Active"),
                    ModelStatus(name="TESSA", archetype="Alt-girl / Grunge", progress=52, status="Standby"),
                ]
            )

        accounts_result = await session.execute(select(AccountPlatform))
        if not accounts_result.scalars().first():
            session.add_all(
                [
                    AccountPlatform(platform="Instagram", accounts=6, status="Active"),
                    AccountPlatform(platform="Threads", accounts=3, status="Warming"),
                    AccountPlatform(platform="X", accounts=4, status="Active"),
                ]
            )

        await session.commit()
