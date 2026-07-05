"""WorkerHeartbeat model — append-only health telemetry from workers."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, Integer, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import HeartbeatStatus
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.worker import Worker


class WorkerHeartbeat(Base):
    __tablename__ = "worker_heartbeats"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    worker_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workers.id", ondelete="CASCADE"), nullable=False
    )
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    cpu_usage: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    memory_usage: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    active_jobs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[HeartbeatStatus] = mapped_column(
        nullable=False, default=HeartbeatStatus.HEALTHY
    )

    # Relationships
    worker: Mapped["Worker"] = relationship(back_populates="heartbeats")

    __table_args__ = (
        Index("idx_heartbeats_worker_reported", "worker_id", reported_at.desc()),
    )

    def __repr__(self) -> str:
        return f"<WorkerHeartbeat id={self.id} worker_id={self.worker_id} status={self.status}>"
