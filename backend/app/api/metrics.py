"""Metrics API routes."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_metrics_service
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.metrics import QueueThroughputResponse, SystemMetricsResponse
from app.services.metrics_service import MetricsService

router = APIRouter()


@router.get("", response_model=SystemMetricsResponse, status_code=status.HTTP_200_OK)
async def get_system_metrics(
    current_user: User = Depends(get_current_user),
    metrics_service: MetricsService = Depends(get_metrics_service),
):
    return await metrics_service.get_system_metrics(current_user)


@router.get("/queues/{queue_id}/throughput", response_model=QueueThroughputResponse, status_code=status.HTTP_200_OK)
async def get_queue_throughput(
    queue_id: uuid.UUID,
    interval: str = "1h",
    current_user: User = Depends(get_current_user),
    metrics_service: MetricsService = Depends(get_metrics_service),
):
    return await metrics_service.get_queue_throughput(queue_id, interval, current_user)


@router.get("/dashboard", status_code=status.HTTP_200_OK)
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    metrics_service: MetricsService = Depends(get_metrics_service),
):
    return await metrics_service.get_dashboard_data(current_user)
