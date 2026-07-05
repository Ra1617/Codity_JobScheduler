"""Metrics Pydantic schema models."""

import uuid

from pydantic import BaseModel


class SystemMetricsResponse(BaseModel):
    total_jobs: int
    jobs_by_status: dict[str, int]
    total_workers: int
    active_workers: int
    total_queues: int
    paused_queues: int
    dlq_unresolved: int
    throughput_last_hour: int
    avg_execution_time_seconds: float | None
    failure_rate_percent: float | None


class QueueThroughputResponse(BaseModel):
    queue_id: uuid.UUID
    queue_name: str
    interval: str
    completed: int
    failed: int
    avg_duration_seconds: float | None
