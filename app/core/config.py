from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="BH_",
        extra="ignore",
        case_sensitive=False,
    )

    environment: Literal["development", "testing", "staging", "production"] = "development"
    debug: bool = False

    database_url: str = "postgresql://bloodheroes:bloodheroes@localhost:5432/bloodheroes"
    db_pool_min: int = 1
    db_pool_max: int = 10

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 30

    h3_resolution: int = Field(default=8, ge=0, le=15)
    default_search_radius_m: int = Field(default=1000, gt=0)
    max_search_radius_m: int = Field(default=50_000, gt=0)
    max_grid_disk_k: int = Field(default=50, gt=0)

    default_page_size: int = Field(default=10, gt=0)
    max_page_size: int = Field(default=100, gt=0)

    cors_origins: str = Field(default="")

    @model_validator(mode="after")
    def _validate(self) -> "Settings":
        if self.environment == "production" and self.jwt_secret == "change-me":
            raise ValueError("BH_JWT_SECRET must be set in production")
        if self.max_search_radius_m < self.default_search_radius_m:
            raise ValueError("BH_MAX_SEARCH_RADIUS_M must be >= BH_DEFAULT_SEARCH_RADIUS_M")
        if self.db_pool_max < self.db_pool_min:
            raise ValueError("BH_DB_POOL_MAX must be >= BH_DB_POOL_MIN")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated BH_CORS_ORIGINS into explicit origins."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sync_database_url(self) -> str:
        """psycopg-compatible URL for migrations (yoyo)."""
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
