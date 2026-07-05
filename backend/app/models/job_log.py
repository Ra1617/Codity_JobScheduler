"""JobLog model — append-only execution log entries (BIGINT PK for volume)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import LogLevel
from app.database.base import Base

if TYPE_CHECKING:
    from app.models.job_execution import JobExecution


class JobLog(Base):
    __tablename__ = "job_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_execution_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("job_executions.id", ondelete="CASCADE"), nullable=False
    )
    log_level: Mapped[LogLevel] = mapped_column(nullable=False, default=LogLevel.INFO)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    execution: Mapped["JobExecution"] = relationship()

    __table_args__ = (
        Index("idx_job_logs_execution_logged", "job_execution_id", "logged_at"),
    )

    def __repr__(self) -> str:
        return f"<JobLog id={self.id} level={self.log_level} execution_id={self.job_execution_id}>"
