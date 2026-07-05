"""Worker main loop."""

import asyncio
import uuid
import socket

from app.core.config import settings
from app.core.logger import get_logger
from app.database.session import AsyncSessionLocal
from app.models.worker import Worker
from app.repositories.worker_repository import WorkerRepository
from app.workers.claim_jobs import claim_jobs
from app.workers.executor import execute_job
from app.workers.graceful_shutdown import setup_graceful_shutdown, graceful_shutdown
from app.workers.heartbeat import heartbeat_loop

logger = get_logger("worker")


async def register_self() -> Worker:
    async with AsyncSessionLocal() as session:
        repo = WorkerRepository(session)
        worker = Worker(
            organization_id=uuid.UUID(int=0), # Dummy for standalone worker
            hostname=socket.gethostname(),
            version="1.0.0",
        )
        worker = await repo.register(worker)
        await session.commit()
        return worker


async def run_worker():
    logger.info("Starting worker node")
    worker = await register_self()
    
    shutdown_event = setup_graceful_shutdown()
    heartbeat_task = asyncio.create_task(heartbeat_loop(worker.id))
    
    while not shutdown_event.is_set():
        try:
            jobs = await claim_jobs(worker.id)
            if jobs:
                # Limit concurrency internally based on queue max_concurrency if needed
                # Here we just execute claimed jobs
                await asyncio.gather(*[execute_job(job, worker.id) for job in jobs])
            else:
                await asyncio.sleep(settings.WORKERS_POLL_INTERVAL)
        except Exception as e:
            logger.error("Worker loop error", error=str(e))
            await asyncio.sleep(settings.WORKERS_POLL_INTERVAL)
    
    await graceful_shutdown(worker.id, heartbeat_task)
    logger.info("Worker node shut down cleanly")

if __name__ == "__main__":
    asyncio.run(run_worker())
