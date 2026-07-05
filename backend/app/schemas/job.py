"""Job Pydantic schema models."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import ExecutionStatus, JobStatus, JobType


class JobCreate(BaseModel):
    queue_id: uuid.UUID
    job_type: JobType = JobType.IMMEDIATE
    payload: dict = Field(default_factory=dict)
    tags: dict | None = None
    priority: int = Field(default=0, ge=0, le=100)
    retry_policy_id: uuid.UUID | None = None
    idempotency_key: str | None = None
    timeout_seconds: int | None = None
    # For delayed jobs
    available_at: datetime | None = None
    # For batch jobs
    batch_name: str | None = None
    batch_jobs: list[dict] | None = None


class ScheduledJobCreate(BaseModel):
    queue_id: uuid.UUID
    name: str
    cron_expression: str
    payload_template: dict = Field(default_factory=dict)
    retry_policy_id: uuid.UUID | None = None


class ScheduledJobUpdate(BaseModel):
    name: str | None = None
    cron_expression: str | None = None
    payload_template: dict | None = None
    is_active: bool | None = None


class JobResponse(BaseModel):
    id: uuid.UUID
    queue_id: uuid.UUID
    batch_id: uuid.UUID | None
    scheduled_job_id: uuid.UUID | None
    retry_policy_id: uuid.UUID | None
    created_by: uuid.UUID
    idempotency_key: str | None
    job_type: str
    payload: dict
    tags: dict | None
    priority: int
    status: JobStatus
    attempt_count: int
    timeout_seconds: int | None
    available_at: datetime | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class JobExecutionResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    worker_id: uuid.UUID | None
    attempt_number: int
    status: ExecutionStatus
    started_at: datetime
    completed_at: datetime | None
    result: dict | None
    error_message: str | None
    next_retry_at: datetime | None


class DLQEntryResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    last_execution_id: uuid.UUID | None
    failure_reason: str
    attempt_count: int
    is_resolved: bool
    resolved_by: uuid.UUID | None
    moved_at: datetime
    resolved_at: datetime | None


class JobDetailResponse(JobResponse):
    executions: list[JobExecutionResponse] = []
    dlq_entry: DLQEntryResponse | None = None
