from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base domain error carrying an application error code and HTTP status."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: int = 1
    message: str = "Application error"

    def __init__(self, message: str | None = None, **extra: Any) -> None:
        self.message = message or self.message
        self.extra = extra
        super().__init__(self.message)

    def payload(self) -> dict[str, Any]:
        return {"code": self.code, "reason": self.message, "extra_info": self.extra}


class FieldRequired(AppError):
    status_code = 400
    code = 104
    message = "field cannot empty"

    def __init__(self, required_field: str | None = None, **extra: Any) -> None:
        super().__init__(required_field=required_field, **extra)


class InvalidEmailFormat(AppError):
    status_code = 400
    code = 105
    message = "Invalid email format"


class InvalidInput(AppError):
    status_code = 400
    code = 106
    message = "Invalid input"


class UnAuthorized(AppError):
    status_code = 401
    code = 130
    message = "UnAuthorized User"


class MissingSessionID(AppError):
    status_code = 400
    code = 101
    message = "required session id"


class MissingAppToken(AppError):
    status_code = 400
    code = 102
    message = "required app id"


class InvalidTokenType(AppError):
    status_code = 401
    code = 134
    message = "Invalid Token type in Authorization Header"


class InvalidCredentials(AppError):
    status_code = 401
    code = 135
    message = "Invalid email or password"


class SessionExpired(AppError):
    status_code = 401
    code = 132
    message = "session has expired"


class AccessDenied(AppError):
    status_code = 403
    code = 401
    message = "User does not have permission to access this resource"


class UserNotFound(AppError):
    status_code = 404
    code = 160
    message = "User not found"


class DonationNotFound(AppError):
    status_code = 404
    code = 168
    message = "Donation not found"


class OfferNotFound(AppError):
    status_code = 404
    code = 169
    message = "Donation offer not found"


class EmailConflict(AppError):
    status_code = 409
    code = 190
    message = "Email address has taken"


class RequisiteAlreadySatisfied(AppError):
    status_code = 406
    code = 191
    message = "Number of donation has already satisfied"


class InternalError(AppError):
    status_code = 500
    code = 700
    message = "Unknown error"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.payload())
