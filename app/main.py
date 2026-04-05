from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.websocket import router as websocket_router

app = FastAPI(
    title="PC Shop API",
    description="API for PC Shop Management System",
    version="1.0.0",
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Hoặc liệt kê các origin cụ thể ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# endpoint check sức khỏe hệ thống
from app.api.deps import healthSys
app.include_router(healthSys)

# endpoint xác thực - Auth
from app.api.deps import auth
app.include_router(auth)

# endpoint user
from app.api.deps import user
app.include_router(user)

# endpoint admin
from app.api.deps import admin
app.include_router(admin)
app.include_router(websocket_router) # WebSocket không cần prefix v1 nếu muốn ngắn gọn

# endpoint categories
from app.api.deps import category_router, product_router, cart_router, favorite_router
app.include_router(category_router)
app.include_router(product_router)
app.include_router(cart_router)
app.include_router(favorite_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", port=8000, reload=True)