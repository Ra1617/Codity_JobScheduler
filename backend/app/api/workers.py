"""Workers API routes."""

import uuid
import math

from fastapi import APIRouter, Depends, status

from app.api.deps import get_heartbeat_service, get_worker_service
from app.core.dependencies import PaginationParams, get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.worker import WorkerHeartbeatRequest, WorkerRegisterRequest, WorkerResponse
from app.services.heartbeat_service import HeartbeatService
from app.services.worker_service import WorkerService

router = APIRouter()


@router.post("/register", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
async def register_worker(
    data: WorkerRegisterRequest,
    current_user: User = Depends(get_current_user),
    worker_service: WorkerService = Depends(get_worker_service),
):
    return await worker_service.register_worker(data, current_user)


@router.post("/{worker_id}/heartbeat", status_code=status.HTTP_200_OK)
async def send_heartbeat(
    worker_id: uuid.UUID,
    data: WorkerHeartbeatRequest,
    current_user: User = Depends(get_current_user),
    heartbeat_service: HeartbeatService = Depends(get_heartbeat_service),
):
    await heartbeat_service.record_heartbeat(worker_id, data)


@router.get("", response_model=PaginatedResponse[WorkerResponse], status_code=status.HTTP_200_OK)
async def list_workers(
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_user),
    worker_service: WorkerService = Depends(get_worker_service),
):
    items, total = await worker_service.worker_repo.list_by_org(current_user.organization_id, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=[worker_service._to_response(w) for w in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if pagination.page_size > 0 else 1,
    )


@router.get("/{worker_id}", response_model=WorkerResponse, status_code=status.HTTP_200_OK)
async def get_worker(
    worker_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    worker_service: WorkerService = Depends(get_worker_service),
):
    from app.core.exceptions import NotFoundException
    worker = await worker_service.worker_repo.get_by_id(worker_id)
    if not worker or worker.organization_id != current_user.organization_id:
        raise NotFoundException("Worker", str(worker_id))
    return worker_service._to_response(worker)


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deregister_worker(
    worker_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    worker_service: WorkerService = Depends(get_worker_service),
):
    await worker_service.deregister_worker(worker_id, current_user)
