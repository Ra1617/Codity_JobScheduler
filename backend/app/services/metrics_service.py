"""Metrics service containing business logic for analytics and dashboard."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.metrics_repository import MetricsRepository
from app.schemas.metrics import QueueThroughputResponse, SystemMetricsResponse


class MetricsService:
    def __init__(self, session: AsyncSession, metrics_repo: MetricsRepository):
        self.session = session
        self.metrics_repo = metrics_repo

    async def get_system_metrics(self, user: User) -> SystemMetricsResponse:
        data = await self.metrics_repo.get_system_metrics(user.organization_id)
        return SystemMetricsResponse(**data)

    async def get_queue_throughput(self, queue_id: uuid.UUID, interval: str, user: User) -> QueueThroughputResponse:
        # Simplistic interval mapping
        hours = 24
        if interval == "1h":
            hours = 1
        elif interval == "7d":
            hours = 168
            
        data = await self.metrics_repo.get_queue_throughput(queue_id, interval_hours=hours)
        return QueueThroughputResponse(
            queue_id=queue_id,
            queue_name="Queue", # Should fetch proper name
            interval=interval,
            **data
        )

    async def get_dashboard_data(self, user: User) -> dict:
        sys_metrics = await self.get_system_metrics(user)
        return {
            "system": sys_metrics.model_dump(),
            "status": "online"
        }
