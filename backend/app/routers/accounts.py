from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import AccountPlatform
from app.schemas import AccountPlatformRead, AccountPlatformUpdate


router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/", response_model=list[AccountPlatformRead])
async def list_accounts(session: AsyncSession = Depends(get_session)) -> list[AccountPlatformRead]:
    result = await session.execute(select(AccountPlatform).order_by(AccountPlatform.id.asc()))
    return list(result.scalars().all())


@router.patch("/{account_id}", response_model=AccountPlatformRead)
async def update_account(
    account_id: int,
    payload: AccountPlatformUpdate,
    session: AsyncSession = Depends(get_session),
) -> AccountPlatformRead:
    platform = await session.get(AccountPlatform, account_id)
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    if payload.accounts is not None:
        platform.accounts = max(0, payload.accounts)
    if payload.status is not None:
        platform.status = payload.status
    await session.commit()
    await session.refresh(platform)
    return platform
