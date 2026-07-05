"""Queue Pydantic schema models."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class QueueCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    priority: int = Field(default=0, ge=0, le=100)
    max_concurrency: int = Field(default=10, ge=1, le=1000)
    timeout_seconds: int = Field(default=3600, ge=1)
    default_retry_policy_id: uuid.UUID | None = None


class QueueUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    priority: int | None = Field(None, ge=0, le=100)
    max_concurrency: int | None = Field(None, ge=1, le=1000)
    timeout_seconds: int | None = Field(None, ge=1)
    default_retry_policy_id: uuid.UUID | None = None
    is_paused: bool | None = None


class QueueResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    description: str | None
    priority: int
    max_concurrency: int
    timeout_seconds: int
    is_paused: bool
    default_retry_policy_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class QueueStatsResponse(BaseModel):
    queue_id: uuid.UUID
    queue_name: str
    total_jobs: int
    queued: int
    running: int
    completed: int
    failed: int
    dead: int
    avg_execution_time_seconds: float | None
    throughput_per_minute: float | None
