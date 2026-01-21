from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import ModelStatus
from app.schemas import ModelStatusRead, ModelStatusUpdate


router = APIRouter(prefix="/models", tags=["models"])


@router.get("/", response_model=list[ModelStatusRead])
async def list_models(session: AsyncSession = Depends(get_session)) -> list[ModelStatusRead]:
    result = await session.execute(select(ModelStatus).order_by(ModelStatus.id.asc()))
    return list(result.scalars().all())


@router.patch("/{model_id}", response_model=ModelStatusRead)
async def update_model(
    model_id: int,
    payload: ModelStatusUpdate,
    session: AsyncSession = Depends(get_session),
) -> ModelStatusRead:
    model = await session.get(ModelStatus, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if payload.progress is not None:
        model.progress = max(0, min(100, payload.progress))
    if payload.status is not None:
        model.status = payload.status
    await session.commit()
    await session.refresh(model)
    return model
