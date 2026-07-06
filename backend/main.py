"""DataMind AI — FastAPI Application Entry Point"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import connect_db, disconnect_db
from app.api.routes import auth, datasets, analysis, chat, reports, forecast


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Data Analyst Agent API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# ── Middleware ──────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Static files (uploaded CSVs, generated PDFs) ───────────────────────────────
import os
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("reports_output", exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/reports_output", StaticFiles(directory="reports_output"), name="reports")

# ── Routes ─────────────────────────────────────────────────────────────────────
app.include_router(auth.router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(chat.router,     prefix="/api/chat",     tags=["Chat"])
app.include_router(reports.router,  prefix="/api/reports",  tags=["Reports"])
app.include_router(forecast.router, prefix="/api/forecast", tags=["Forecast"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
