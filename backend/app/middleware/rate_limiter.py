"""Rate limiter middleware."""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings

# Dummy in-memory implementation for demonstration.
# In a real system, this would use Redis.
_request_counts = {}


class RateLimiterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # A real implementation would rate limit based on API key/Token
        # Simplification: Allow all for now, to ensure smooth API testing
        response = await call_next(request)
        return response
