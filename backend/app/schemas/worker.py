"""Worker Pydantic schema models."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.core.constants import HeartbeatStatus, WorkerStatus


class WorkerRegisterRequest(BaseModel):
    hostname: str
    version: str | None = None


class WorkerHeartbeatRequest(BaseModel):
    cpu_usage: float | None = None
    memory_usage: float | None = None
    active_jobs: int = 0
    status: HeartbeatStatus = HeartbeatStatus.HEALTHY


class WorkerResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    hostname: str
    version: str | None
    status: WorkerStatus
    last_heartbeat_at: datetime | None
    created_at: datetime
    updated_at: datetime
