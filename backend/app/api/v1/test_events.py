from typing import Optional

from fastapi import APIRouter, Depends
from ipaddress import IPv4Address, IPv6Address
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import broadcaster
from app.core.database import get_db

router = APIRouter()


class PublishRequest(BaseModel):
    user: str
    event: str
    resume_id: Optional[str] = None
    data: Optional[dict] = None


@router.post('/publish')
async def publish_event(req: PublishRequest):
    channel = f"user:{req.user}"
    message = {"event": req.event}
    if req.resume_id:
        message["resume_id"] = req.resume_id
    if req.data:
        message["data"] = req.data

    await broadcaster.publish(channel, message)
    return {"published": True}


def _normalize(value: object | None) -> object | None:
    if isinstance(value, (IPv4Address, IPv6Address)):
        return str(value)
    return value


@router.get('/db-info')
async def db_info(db: AsyncSession = Depends(get_db)) -> dict[str, object | None]:
    """Test-only endpoint to inspect the connection state and table visibility."""

    async def _execute_scalar(query: str, *, column: str | None = None) -> object | None:
        try:
            result = await db.execute(text(query))
            row = result.first()
            if row is None:
                return None
            if column:
                return _normalize(getattr(row, column, None))
            return _normalize(row[0])
        except Exception as exc:
            await db.rollback()
            return f"error: {exc}"

    info: dict[str, object | None] = {
        "current_schema": await _execute_scalar("SELECT current_schema()"),
        "current_schemas": await _execute_scalar("SELECT current_schemas(true)", column="current_schemas"),
        "current_database": await _execute_scalar("SELECT current_database()"),
        "current_user": await _execute_scalar("SELECT current_user"),
        "session_user": await _execute_scalar("SELECT session_user"),
        "pg_backend_pid": await _execute_scalar("SELECT pg_backend_pid()"),
        "server_addr": await _execute_scalar("SELECT inet_server_addr()"),
        "server_port": await _execute_scalar("SELECT inet_server_port()"),
        "version": await _execute_scalar("SELECT version()"),
        "search_path": await _execute_scalar("SELECT current_setting('search_path')"),
        "to_regclass_public_users": await _execute_scalar("SELECT to_regclass('public.users')"),
        "users_table_schema": await _execute_scalar(
            "SELECT schemaname FROM pg_tables WHERE tablename='users' LIMIT 1"
        ),
    }

    res = await db.execute(
        text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users')")
    )
    row = res.first()
    info["users_in_information_schema"] = bool(row[0]) if row is not None else False

    try:
        count_res = await db.execute(text("SELECT count(*) AS cnt FROM public.users"))
        count_row = count_res.first()
        info["users_count"] = int(count_row[0]) if count_row is not None else None
    except Exception as exc:
        await db.rollback()
        info["users_count_error"] = str(exc)

    return info
