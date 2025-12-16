from typing import AsyncIterator, Iterator
from sqlalchemy import text, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine.url import make_url, URL
from app.core.config import settings

# Build and validate database URL; ensure asyncpg driver for PostgreSQL
raw_db_url = settings.DATABASE_URL
if not raw_db_url:
    raise RuntimeError("DATABASE_URL is not set. Provide a valid database connection string.")

url: URL = make_url(raw_db_url)
if url.drivername.startswith("postgresql") and "+" not in url.drivername:
    # Enforce async driver for async engine
    url = url.set(drivername="postgresql+asyncpg")

# Configurable SQLAlchemy engine settings
sqlalchemy_echo = getattr(settings, "SQLALCHEMY_ECHO", False)
pool_size = settings.SQLALCHEMY_POOL_SIZE if settings.SQLALCHEMY_POOL_SIZE is not None else 5
max_overflow = settings.SQLALCHEMY_MAX_OVERFLOW if settings.SQLALCHEMY_MAX_OVERFLOW is not None else 10
pool_timeout = settings.SQLALCHEMY_POOL_TIMEOUT if settings.SQLALCHEMY_POOL_TIMEOUT is not None else 30

try:
    engine = create_async_engine(
        url.render_as_string(hide_password=False),
        pool_pre_ping=True,
        echo=sqlalchemy_echo,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
        connect_args={"server_settings": {"search_path": "public"}},
    )
except Exception as e:
    raise RuntimeError(f"Failed to create database engine: {e}") from e

# Typed session factory
AsyncSessionLocal: sessionmaker[AsyncSession] = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Standard FastAPI dependency to get an async session
async def get_db() -> AsyncIterator[AsyncSession]:
    """Provide an AsyncSession for the request, with search_path set to public."""
    async with AsyncSessionLocal() as session:
        await session.execute(text("SET search_path TO public"))
        yield session

# Graceful shutdown helper to dispose engine
async def dispose_engine() -> None:
    await engine.dispose()


# ============ Synchronous Database Access (for Celery) ============

# Build sync URL (remove asyncpg driver if present)
sync_url: URL = make_url(raw_db_url)
if "+" in sync_url.drivername:
    sync_url = sync_url.set(drivername="postgresql+psycopg2")
elif sync_url.drivername.startswith("postgresql"):
    sync_url = sync_url.set(drivername="postgresql+psycopg2")

try:
    sync_engine = create_engine(
        sync_url.render_as_string(hide_password=False),
        pool_pre_ping=True,
        echo=sqlalchemy_echo,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
    )
except Exception as e:
    # Fallback: some deployments may not have psycopg2
    sync_engine = None

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
) if sync_engine else None


def get_db_sync() -> Session:
    """Provide a synchronous Session for Celery tasks."""
    if SyncSessionLocal is None:
        raise RuntimeError("Synchronous database not configured. Install psycopg2-binary.")
    session = SyncSessionLocal()
    return session


def get_sync_db() -> Iterator[Session]:
    """FastAPI dependency for synchronous database session."""
    if SyncSessionLocal is None:
        raise RuntimeError("Synchronous database not configured. Install psycopg2-binary.")
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()
