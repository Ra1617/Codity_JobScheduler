"""Worker heartbeat loop."""

import asyncio
import uuid

from app.core.config import settings
from app.core.constants import HeartbeatStatus
from app.database.session import AsyncSessionLocal
from app.repositories.worker_repository import WorkerRepository
from app.schemas.worker import WorkerHeartbeatRequest
from app.services.heartbeat_service import HeartbeatService
from app.core.logger import get_logger

logger = get_logger("heartbeat")


def get_cpu_usage() -> float:
    # Requires psutil, mock for demo
    return 10.5


def get_memory_usage() -> float:
    # Requires psutil, mock for demo
    return 150.0


def get_active_job_count() -> int:
    return 0


async def heartbeat_loop(worker_id: uuid.UUID):
    while True:
        try:
            async with AsyncSessionLocal() as session:
                worker_repo = WorkerRepository(session)
                heartbeat_service = HeartbeatService(session, worker_repo)
                
                req = WorkerHeartbeatRequest(
                    cpu_usage=get_cpu_usage(),
                    memory_usage=get_memory_usage(),
                    active_jobs=get_active_job_count(),
                    status=HeartbeatStatus.HEALTHY,
                )
                await heartbeat_service.record_heartbeat(worker_id, req)
                await session.commit()
                
        except Exception as e:
            logger.error("Heartbeat error", error=str(e))
            
        await asyncio.sleep(settings.WORKERS_HEARTBEAT_INTERVAL)
