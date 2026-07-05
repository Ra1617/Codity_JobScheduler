"""Auth middleware."""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.security import verify_token
from app.core.logger import get_logger

logger = get_logger("auth_middleware")


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # A real implementation would parse token and set user info in request state
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = verify_token(token)
                request.state.user_id = payload.get("sub")
                request.state.org_id = payload.get("org_id")
            except Exception as e:
                logger.warning("Invalid token", error=str(e))
        return await call_next(request)
