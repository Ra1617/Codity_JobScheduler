"""Jobs API routes."""

import uuid
import math
from typing import List, Union

from fastapi import APIRouter, Depends, status

from app.api.deps import get_job_service
from app.core.constants import JobStatus
from app.core.dependencies import PaginationParams, get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.job import (
    JobCreate,
    JobDetailResponse,
    JobResponse,
    ScheduledJobCreate,
    ScheduledJobUpdate,
)
from app.services.job_service import JobService

router = APIRouter()


@router.post("/jobs", response_model=Union[JobResponse, List[JobResponse]], status_code=status.HTTP_201_CREATED)
async def create_job(
    data: JobCreate,
    current_user: User = Depends(get_current_user),
    job_service: JobService = Depends(get_job_service),
):
    return await job_service.create_job(data, current_user)


@router.get("/queues/{queue_id}/jobs", response_model=PaginatedResponse[JobResponse], status_code=status.HTTP_200_OK)
async def list_jobs(
    queue_id: uuid.UUID,
    status_filter: JobStatus | None = None,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_user),
    job_service: JobService = Depends(get_job_service),
):
    # Missing list_jobs in JobService, we'll map to job_repo
    items, total = await job_service.job_repo.list_by_queue(queue_id, status_filter, pagination.page, pagination.page_size)
    return PaginatedResponse(
        items=[job_service._to_response(j) for j in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if pagination.page_size > 0 else 1,
    )


@router.get("/jobs/{job_id}", response_model=JobDetailResponse, status_code=status.HTTP_200_OK)
async def get_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    job_service: JobService = Depends(get_job_service),
):
    return await job_service.get_job(job_id, current_user)


@router.post("/jobs/{job_id}/cancel", response_model=JobResponse, status_code=status.HTTP_200_OK)
async def cancel_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    job_service: JobService = Depends(get_job_service),
):
    return await job_service.cancel_job(job_id, current_user)


@router.post("/jobs/{job_id}/retry", response_model=JobResponse, status_code=status.HTTP_200_OK)
async def retry_job(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    job_service: JobService = Depends(get_job_service),
):
    return await job_service.retry_job(job_id, current_user)
