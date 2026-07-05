from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception with structured error codes."""

    def __init__(self, status_code: int, detail: str, error_code: str = None):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


class NotFoundException(AppException):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with id '{resource_id}' not found",
            error_code="RESOURCE_NOT_FOUND",
        )


class ConflictException(AppException):
    """Raised on data conflict (duplicate name, state violation, etc.)."""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="CONFLICT",
        )


class ForbiddenException(AppException):
    """Raised when the caller lacks sufficient permissions."""

    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN",
        )


class QueuePausedException(AppException):
    """Raised when a job is submitted to a paused queue."""

    def __init__(self, queue_id: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Queue '{queue_id}' is paused. Resume it before submitting jobs.",
            error_code="QUEUE_PAUSED",
        )


class IdempotencyConflictException(AppException):
    """Raised when a duplicate idempotency key is detected."""

    def __init__(self, idempotency_key: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job with idempotency_key '{idempotency_key}' already exists",
            error_code="IDEMPOTENCY_CONFLICT",
        )
