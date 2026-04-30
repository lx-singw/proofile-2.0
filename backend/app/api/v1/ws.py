from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError
from app.core import broadcaster, security
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = Query(...)):
    # Authenticate before accepting the connection
    try:
        payload = security.decode_access_token(token)
        if not payload.get("sub"):
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    user_channel = f"user:{user_id}"
    global_channel = "global_feed"
    
    async def listen_and_send(channel):
        async for message in broadcaster.subscribe(channel):
            try:
                await websocket.send_json(message)
            except Exception:
                return False
        return True

    try:
        # Listen to both channels concurrently
        await asyncio.gather(
            listen_and_send(user_channel),
            listen_and_send(global_channel)
        )
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WS error for user %s: %s", user_id, e)
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
