from fastapi import APIRouter
from app.api.routers import health # import file health
from app.api.routers.auth import auth_register

# Health
healthSys = APIRouter(prefix="/api/v1/health", tags=["Health"])
healthSys.include_router(health.router)


# Auth
auth = APIRouter(prefix="/api/v1/auth", tags=["Auth"])
auth.include_router(auth_register.router)