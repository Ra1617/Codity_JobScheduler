"""Scheduler API routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_role
from app.core.constants import UserRole
from app.models.user import User
from app.services.scheduler_service import SchedulerService

router = APIRouter()


def get_scheduler_service(db: AsyncSession = Depends(get_db)) -> SchedulerService:
    return SchedulerService(db)


@router.post("/trigger-cron", status_code=status.HTTP_200_OK)
async def trigger_cron(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    scheduler_service: SchedulerService = Depends(get_scheduler_service),
):
    count = await scheduler_service.process_cron_jobs()
    return {"message": "Cron jobs processed", "created_count": count}


@router.post("/trigger-delayed", status_code=status.HTTP_200_OK)
async def trigger_delayed(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    scheduler_service: SchedulerService = Depends(get_scheduler_service),
):
    count = await scheduler_service.process_delayed_jobs()
    return {"message": "Delayed jobs processed", "updated_count": count}


@router.get("/status", status_code=status.HTTP_200_OK)
async def scheduler_status(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    return {"status": "healthy"}
