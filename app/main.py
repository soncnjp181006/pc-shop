from fastapi import FastAPI
app = FastAPI(title="PC-Shop Backend")

# endpoint check sức khỏe hệ thống
from app.api.deps import healthSys
app.include_router(healthSys)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", port=8000, reload=True)