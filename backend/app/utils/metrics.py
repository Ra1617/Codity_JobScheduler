"""Metrics utility."""


def calculate_failure_rate(failed: int, total: int) -> float:
    if total == 0:
        return 0.0
    return (failed / total) * 100.0


def calculate_throughput(count: int, seconds: float) -> float:
    """Returns items per minute."""
    if seconds <= 0:
        return 0.0
    return (count / seconds) * 60.0
