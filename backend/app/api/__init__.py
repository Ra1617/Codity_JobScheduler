"""API routes package."""

from fastapi import APIRouter

from app.api import (
    auth,
    health,
    jobs,
    metrics,
    organizations,
    projects,
    queues,
    scheduler,
    workers,
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(queues.router, tags=["Queues"])  # Prefixes handled in endpoints for rest pattern
api_router.include_router(jobs.router, tags=["Jobs"])
api_router.include_router(workers.router, prefix="/workers", tags=["Workers"])
api_router.include_router(scheduler.router, prefix="/scheduler", tags=["Scheduler"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
