from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import manager

router = APIRouter()

@router.websocket("/ws/stock")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Giữ kết nối mở, có thể nhận heartbeat nếu cần
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
