"""FastAPI application entry point for Bonsai Desk.

This module initializes the FastAPI application, configures middleware,
and registers API routes for the Bonsai Desk backend.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse

from app.api.routes_chat import router as chat_router
from app.api.routes_conversations import router as conversations_router
from app.api.routes_models import router as models_router
from app.api.routes_runtime import router as runtime_router
from app.core.config import settings
from app.services import chat_service, runtime_manager, storage


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Manage application lifespan events.
    
    This context manager handles startup and shutdown events for the
    FastAPI application. It ensures proper cleanup of resources,
    particularly the runtime manager, when the application shuts down.
    
    Args:
        _: The FastAPI application instance (unused).
        
    Yields:
        None: Control is yielded to the application during its lifetime.
    """
    try:
        yield
    finally:
        await runtime_manager.shutdown()


# Initialize FastAPI application with lifespan management
app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    description="Local-first chat API for running Bonsai models with Prism runtime",
    version="0.1.0",
    docs_url=None,  # Disable default docs, use custom endpoint
    redoc_url=None,  # Disable default redoc
)

# Configure CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers with versioned prefix
app.include_router(runtime_router, prefix=settings.api_prefix)
app.include_router(models_router, prefix=settings.api_prefix)
app.include_router(conversations_router, prefix=settings.api_prefix)
app.include_router(chat_router, prefix=settings.api_prefix)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint.
    
    Returns a simple status response to indicate the backend
    is running and responsive.
    
    Returns:
        dict[str, str]: A dictionary with status "ok".
        
    Example:
        GET /health
        Response: {"status": "ok"}
    """
    return {"status": "ok"}


@app.get("/docs", response_class=HTMLResponse)
async def custom_swagger_ui_html():
    """Custom Swagger UI endpoint for API documentation.
    
    Returns:
        HTMLResponse: Swagger UI HTML page.
    """
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{settings.app_name} - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )


@app.get("/openapi.json")
async def get_openapi_endpoint():
    """OpenAPI schema endpoint.
    
    Returns the OpenAPI JSON schema for the API.
    
    Returns:
        dict: OpenAPI schema.
    """
    return get_openapi(
        title=settings.app_name,
        version="0.1.0",
        description="Local-first chat API for running Bonsai models with Prism runtime",
        routes=app.routes,
    )
