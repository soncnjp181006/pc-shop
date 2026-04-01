from fastapi import FastAPI
app = FastAPI(title="PC-Shop Backend")

# endpoint check sức khỏe hệ thống
from app.api.deps import healthSys
app.include_router(healthSys)

# endpoint xác thực - Auth
from app.api.deps import auth
app.include_router(auth)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", port=8000, reload=True)