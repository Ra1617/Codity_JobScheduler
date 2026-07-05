"""DeadLetterQueueEntry model — permanently failed jobs after retry exhaustion."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.job_execution import JobExecution
    from app.models.user import User


class DeadLetterQueueEntry(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "dead_letter_queue"

    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    last_execution_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("job_executions.id", ondelete="SET NULL"), nullable=True
    )
    failure_reason: Mapped[str] = mapped_column(Text, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    moved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    job: Mapped["Job"] = relationship(back_populates="dlq_entry")
    last_execution: Mapped["JobExecution | None"] = relationship()
    resolver: Mapped["User | None"] = relationship()

    __table_args__ = (
        Index(
            "idx_dlq_unresolved",
            "is_resolved",
            postgresql_where=text("is_resolved = false"),
        ),
    )

    def __repr__(self) -> str:
        return f"<DLQEntry id={self.id} job_id={self.job_id} resolved={self.is_resolved}>"
