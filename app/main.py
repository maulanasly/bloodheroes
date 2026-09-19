from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, donations, geo, users
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.db.postgres import close_pool, init_pool


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_pool()
    try:
        yield
    finally:
        await close_pool()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Bloodheroes API",
        version="2.0.0",
        description="Blood donation API built with FastAPI, PostgreSQL/PostGIS and H3.",
        lifespan=lifespan,
    )
    register_exception_handlers(app)

    if settings.cors_origin_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_credentials=False,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["X-APP-TOKEN", "Authorization", "Content-Type"],
        )

    app.include_router(auth.router, prefix="/v1")
    app.include_router(users.router, prefix="/v1")
    app.include_router(donations.router, prefix="/v1")
    app.include_router(geo.router, prefix="/v1")

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "environment": settings.environment}

    return app


app = create_app()
