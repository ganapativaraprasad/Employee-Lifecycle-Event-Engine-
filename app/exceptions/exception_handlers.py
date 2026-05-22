from fastapi import Request
from fastapi.responses import JSONResponse

from app.exceptions.custom_exceptions import (
    EmployeeNotFoundException,
    InvalidTransitionException,
    PermissionDeniedException
)


async def employee_not_found_handler(
    request: Request,
    exc: EmployeeNotFoundException
):

    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "message": exc.message
        }
    )


async def invalid_transition_handler(
    request: Request,
    exc: InvalidTransitionException
):

    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "message": exc.message
        }
    )


async def permission_denied_handler(
    request: Request,
    exc: PermissionDeniedException
):

    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "message": exc.message
        }
    )