from __future__ import annotations

import asyncpg

from app.core.config import settings

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=settings.db_pool_min,
            max_size=settings.db_pool_max,
        )


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool is not initialized")
    return _pool


async def get_conn():
    """FastAPI dependency yielding a pooled connection.

    Lazily initialises the pool so the app still works if the ASGI server did
    not run the lifespan handshake (e.g. Granian lifespan fallback).
    """
    if _pool is None:
        await init_pool()
    async with get_pool().acquire() as conn:
        yield conn
