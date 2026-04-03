from fastapi import APIRouter
from app.api.routers import health # import file health
from app.api.routers.auth import auth_register, auth_login
from app.api.routers.auth import auth_register, auth_login, auth_refresh

# Health
healthSys = APIRouter(prefix="/api/v1/health", tags=["Health"])
healthSys.include_router(health.router)


# Auth
auth = APIRouter(prefix="/api/v1/auth", tags=["Auth"])
auth.include_router(auth_register.router)
auth.include_router(auth_login.router)
auth.include_router(auth_refresh.router)

from app.api.routers.user import get_me

# User
user = APIRouter(prefix="/api/v1/user", tags=["User"])
user.include_router(get_me.router)
