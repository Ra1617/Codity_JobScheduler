"""Batch model — groups multiple jobs for collective tracking."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import BatchStatus
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.queue import Queue
    from app.models.user import User


class Batch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "batches"

    queue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("queues.id", ondelete="CASCADE"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    total_jobs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_jobs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_jobs: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[BatchStatus] = mapped_column(
        nullable=False, default=BatchStatus.PENDING
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    queue: Mapped["Queue"] = relationship()
    creator: Mapped["User"] = relationship()
    jobs: Mapped[List["Job"]] = relationship(back_populates="batch")

    def __repr__(self) -> str:
        return f"<Batch id={self.id} status={self.status} {self.completed_jobs}/{self.total_jobs}>"
