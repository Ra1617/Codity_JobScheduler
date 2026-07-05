"""Queue priority utility."""

from app.models.queue import Queue


def sort_queues_by_priority(queues: list[Queue]) -> list[Queue]:
    """Compare and sort queues by priority. Higher number = higher priority."""
    return sorted(queues, key=lambda q: q.priority, reverse=True)
