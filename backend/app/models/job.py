"""Job model — the central work-item entity.

Contains the critical ``idx_jobs_claimable`` partial index used by workers to
atomically claim queued jobs via SELECT FOR UPDATE SKIP LOCKED.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import JobStatus
from app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.batch import Batch
    from app.models.dead_letter_queue import DeadLetterQueueEntry
    from app.models.job_execution import JobExecution
    from app.models.queue import Queue
    from app.models.retry_policy import RetryPolicy
    from app.models.scheduled_job import ScheduledJob
    from app.models.user import User


class Job(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "jobs"

    queue_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("queues.id", ondelete="CASCADE"), nullable=False
    )
    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("batches.id", ondelete="SET NULL"), nullable=True
    )
    scheduled_job_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("scheduled_jobs.id", ondelete="SET NULL"), nullable=True
    )
    retry_policy_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("retry_policies.id", ondelete="SET NULL"), nullable=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    idempotency_key: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True
    )
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    tags: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    priority: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    status: Mapped[JobStatus] = mapped_column(nullable=False, default=JobStatus.QUEUED)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    timeout_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    available_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    queue: Mapped["Queue"] = relationship(back_populates="jobs")
    batch: Mapped["Batch | None"] = relationship(back_populates="jobs")
    scheduled_job: Mapped["ScheduledJob | None"] = relationship()
    retry_policy: Mapped["RetryPolicy | None"] = relationship()
    creator: Mapped["User"] = relationship()
    executions: Mapped[List["JobExecution"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )
    dlq_entry: Mapped["DeadLetterQueueEntry | None"] = relationship(
        back_populates="job", uselist=False
    )

    __table_args__ = (
        # HOT-PATH index for worker claiming
        Index(
            "idx_jobs_claimable",
            "queue_id",
            "status",
            "priority",
            "available_at",
            postgresql_where=text("status = 'queued'"),
        ),
        Index("idx_jobs_idempotency_key", "idempotency_key", unique=True),
        Index("idx_jobs_batch_id", "batch_id"),
        Index("idx_jobs_scheduled_job_id", "scheduled_job_id"),
        Index("idx_jobs_created_by", "created_by"),
    )

    def __repr__(self) -> str:
        return f"<Job id={self.id} type={self.job_type} status={self.status}>"
