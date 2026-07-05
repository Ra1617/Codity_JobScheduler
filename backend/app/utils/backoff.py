"""Backoff utility."""

from app.core.constants import BackoffStrategy


def calculate_backoff(
    strategy: BackoffStrategy,
    attempt: int,
    base_delay: int,
    max_delay: int
) -> int:
    if strategy == BackoffStrategy.FIXED:
        return min(base_delay, max_delay)
    elif strategy == BackoffStrategy.LINEAR:
        return min(base_delay * attempt, max_delay)
    elif strategy == BackoffStrategy.EXPONENTIAL:
        return min(base_delay * (2 ** (attempt - 1)), max_delay)
    return base_delay
