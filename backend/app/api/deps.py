"""API Dependencies."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.repositories.job_repository import JobRepository
from app.repositories.metrics_repository import MetricsRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.queue_repository import QueueRepository
from app.repositories.user_repository import UserRepository
from app.repositories.worker_repository import WorkerRepository
from app.services.auth_service import AuthService
from app.services.dlq_service import DLQService
from app.services.heartbeat_service import HeartbeatService
from app.services.job_service import JobService
from app.services.metrics_service import MetricsService
from app.services.queue_service import QueueService
from app.services.retry_service import RetryService
from app.services.worker_service import WorkerService


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db, UserRepository(db))


def get_queue_service(db: AsyncSession = Depends(get_db)) -> QueueService:
    return QueueService(db, QueueRepository(db), ProjectRepository(db))


def get_job_service(db: AsyncSession = Depends(get_db)) -> JobService:
    return JobService(db, JobRepository(db), QueueRepository(db), ProjectRepository(db))


def get_worker_service(db: AsyncSession = Depends(get_db)) -> WorkerService:
    return WorkerService(db, WorkerRepository(db))


def get_heartbeat_service(db: AsyncSession = Depends(get_db)) -> HeartbeatService:
    return HeartbeatService(db, WorkerRepository(db))


def get_dlq_service(db: AsyncSession = Depends(get_db)) -> DLQService:
    return DLQService(db, JobRepository(db))


def get_retry_service(db: AsyncSession = Depends(get_db)) -> RetryService:
    return RetryService(db, JobRepository(db), DLQService(db, JobRepository(db)))


def get_metrics_service(db: AsyncSession = Depends(get_db)) -> MetricsService:
    return MetricsService(db, MetricsRepository(db))
