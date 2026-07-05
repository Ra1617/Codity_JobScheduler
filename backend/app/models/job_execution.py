"""JobExecution model — records each attempt at running a job."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import ExecutionStatus
from app.database.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.worker import Worker


class JobExecution(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "job_executions"

    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workers.id", ondelete="SET NULL"), nullable=True
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ExecutionStatus] = mapped_column(
        nullable=False, default=ExecutionStatus.RUNNING
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_retry_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    job: Mapped["Job"] = relationship(back_populates="executions")
    worker: Mapped["Worker | None"] = relationship()

    __table_args__ = (
        UniqueConstraint("job_id", "attempt_number", name="uq_execution_job_attempt"),
        Index("idx_executions_worker_id", "worker_id"),
        Index("idx_executions_job_id", "job_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<JobExecution id={self.id} job_id={self.job_id} "
            f"attempt={self.attempt_number} status={self.status}>"
        )
