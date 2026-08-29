import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.session import init_db
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.documents import router as doc_router
from app.api.admin import router as admin_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("campusmind")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing CampusMind backend services...")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.QDRANT_STORAGE_PATH, exist_ok=True)
    await init_db()
    logger.info("Database tables initialized successfully.")
    yield
    # Shutdown
    logger.info("Shutting down CampusMind backend services.")


app = FastAPI(
    title="CampusMind API",
    description="AI College Information Assistant Backend with Retrieval-Augmented Generation (RAG)",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(doc_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    return {
        "app": "CampusMind — AI College Information Assistant API",
        "version": "1.0.0",
        "status": "operational",
        "docs_url": "/docs"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENV,
        "database": "connected",
        "vector_store": "ready"
    }
