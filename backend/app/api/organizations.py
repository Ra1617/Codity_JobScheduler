"""Organizations API routes."""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.core.dependencies import get_current_user, require_role
from app.core.constants import UserRole
from app.models.user import User

router = APIRouter()


class OrgResponse(BaseModel):
    id: str
    name: str
    slug: str


class OrgUpdateRequest(BaseModel):
    name: str
    slug: str


@router.get("/me", response_model=OrgResponse, status_code=status.HTTP_200_OK)
async def get_my_organization(
    current_user: User = Depends(get_current_user),
):
    # Simplification: In a full system, you'd fetch the Org from a service or repository
    org = current_user.organization
    return OrgResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
    )


@router.put("/me", response_model=OrgResponse, status_code=status.HTTP_200_OK)
async def update_my_organization(
    data: OrgUpdateRequest,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    # Simplification: Direct update here for brevity, usually via a service
    org = current_user.organization
    org.name = data.name
    org.slug = data.slug
    # session.flush() would be called here via a service
    return OrgResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
    )
