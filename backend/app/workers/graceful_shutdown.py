"""Graceful shutdown logic."""

import asyncio
import signal
import uuid

from app.core.constants import WorkerStatus
from app.database.session import AsyncSessionLocal
from app.repositories.worker_repository import WorkerRepository
from app.services.worker_service import WorkerService
from app.core.logger import get_logger

logger = get_logger("shutdown")


def setup_graceful_shutdown() -> asyncio.Event:
    shutdown_event = asyncio.Event()
    
    def handler(signum, frame):
        logger.info("Shutdown signal received, draining...")
        shutdown_event.set()
    
    # Registering signals only works in main thread
    try:
        signal.signal(signal.SIGTERM, handler)
        signal.signal(signal.SIGINT, handler)
    except ValueError:
        pass
        
    return shutdown_event


async def graceful_shutdown(worker_id: uuid.UUID, heartbeat_task: asyncio.Task):
    logger.info("Initiating graceful shutdown", worker_id=str(worker_id))
    
    async with AsyncSessionLocal() as session:
        worker_repo = WorkerRepository(session)
        worker_service = WorkerService(session, worker_repo)
        
        worker = await worker_repo.get_by_id(worker_id)
        if worker:
            worker.status = WorkerStatus.DRAINING
            await session.commit()
            
    # Allow some time for running jobs to finish (in reality, wait on active tasks)
    await asyncio.sleep(2)
    
    heartbeat_task.cancel()
    
    async with AsyncSessionLocal() as session:
        worker_repo = WorkerRepository(session)
        worker = await worker_repo.get_by_id(worker_id)
        if worker:
            worker.status = WorkerStatus.OFFLINE
            await session.commit()
            
    logger.info("Shutdown complete")
