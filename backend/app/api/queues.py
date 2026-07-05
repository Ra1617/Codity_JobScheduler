"""Queues API routes."""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import get_queue_service
from app.core.dependencies import PaginationParams, get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.queue import QueueCreate, QueueResponse, QueueStatsResponse, QueueUpdate
from app.services.queue_service import QueueService

router = APIRouter()


@router.post("/projects/{project_id}/queues", response_model=QueueResponse, status_code=status.HTTP_201_CREATED)
async def create_queue(
    project_id: uuid.UUID,
    data: QueueCreate,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service),
):
    return await queue_service.create_queue(project_id, data, current_user)


@router.get("/projects/{project_id}/queues", response_model=PaginatedResponse[QueueResponse], status_code=status.HTTP_200_OK)
async def list_queues(
    project_id: uuid.UUID,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service),
):
    return await queue_service.list_queues(project_id, current_user, pagination.page, pagination.page_size)


@router.get("/queues/{queue_id}", response_model=QueueResponse, status_code=status.HTTP_200_OK)
async def get_queue(
    queue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service),
):
    queue = await queue_service._get_queue_for_org(queue_id, current_user.organization_id)
    return queue_service._to_response(queue)


@router.put("/queues/{queue_id}", response_model=QueueResponse, status_code=status.HTTP_200_OK)
async def update_queue(
    queue_id: uuid.UUID,
    data: QueueUpdate,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service),
):
    return await queue_service.update_queue(queue_id, data, current_user)


@router.delete("/queues/{queue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_queue(
    queue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service),
):
    await queue_service.delete_queue(queue_id, current_user)


@router.post("/queues/{queue_id}/pause", response_model=QueueResponse, status_code=status.HTTP_200_OK)
async def pause_queue(
    queue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service),
):
    return await queue_service.pause_queue(queue_id, current_user)


@router.post("/queues/{queue_id}/resume", response_model=QueueResponse, status_code=status.HTTP_200_OK)
async def resume_queue(
    queue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service),
):
    return await queue_service.resume_queue(queue_id, current_user)


@router.get("/queues/{queue_id}/stats", response_model=QueueStatsResponse, status_code=status.HTTP_200_OK)
async def get_queue_stats(
    queue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service),
):
    return await queue_service.get_queue_stats(queue_id, current_user)
