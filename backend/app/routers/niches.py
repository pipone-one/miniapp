from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Niche
from app.schemas import NicheCreate, NicheRead

router = APIRouter(prefix="/niches", tags=["niches"])


@router.post("/", response_model=NicheRead)
async def create_niche(payload: NicheCreate, session: AsyncSession = Depends(get_session)) -> NicheRead:
    niche = Niche(**payload.model_dump())
    session.add(niche)
    await session.commit()
    await session.refresh(niche)
    return niche


@router.get("/", response_model=list[NicheRead])
async def list_niches(session: AsyncSession = Depends(get_session)) -> list[NicheRead]:
    result = await session.execute(select(Niche).where(Niche.is_active == True).order_by(Niche.id.asc()))
    return list(result.scalars().all())


@router.delete("/{niche_id}")
async def delete_niche(niche_id: int, session: AsyncSession = Depends(get_session)) -> dict:
    niche = await session.get(Niche, niche_id)
    if not niche:
        raise HTTPException(status_code=404, detail="Niche not found")
    
    niche.is_active = False
    await session.commit()
    return {"status": "archived"}
