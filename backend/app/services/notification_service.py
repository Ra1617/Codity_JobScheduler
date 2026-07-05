"""Notification service for alerting on job states and worker statuses."""

from app.core.logger import get_logger
from app.models.dead_letter_queue import DeadLetterQueueEntry
from app.models.job import Job
from app.models.worker import Worker

logger = get_logger("notification_service")


class NotificationService:
    async def notify_job_completed(self, job: Job) -> None:
        logger.info(f"Job completed: {job.id}", job_type=job.job_type)

    async def notify_job_failed(self, job: Job, error: str) -> None:
        logger.error(f"Job failed: {job.id}", error=error, attempt=job.attempt_count)

    async def notify_worker_offline(self, worker: Worker) -> None:
        logger.warning(f"Worker went offline: {worker.id}", hostname=worker.hostname)

    async def notify_dlq_entry(self, entry: DeadLetterQueueEntry) -> None:
        logger.critical(f"Job moved to DLQ: {entry.job_id}", reason=entry.failure_reason)
