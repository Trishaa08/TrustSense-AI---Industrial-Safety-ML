from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from app.config import CORS_ORIGINS, ENVIRONMENT, SAFETY_DISCLAIMER
from app.routers import (
    system, datasets, sensors, predict, localization, alerts, models, simulation, reports
)
from app.models.model_registry import model_registry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("trustsense.main")

app = FastAPI(
    title="TrustSense-Gas API",
    description=(
        "Research Prototype for Fault-Aware Gas Leak Monitoring, Sensor Health Diagnostics, "
        "and Reliability-Weighted Spatial Localization.\n\n"
        f"**IMPORTANT DISCLAIMER:** {SAFETY_DISCLAIMER}"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & local Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred during processing.",
            "detail": str(exc) if ENVIRONMENT == "development" else "Internal server error",
            "path": request.url.path
        }
    )

# Include versioned API routers
api_prefix = "/api/v1"
app.include_router(system.router, prefix=api_prefix)
app.include_router(datasets.router, prefix=api_prefix)
app.include_router(sensors.router, prefix=api_prefix)
app.include_router(predict.router, prefix=api_prefix)
app.include_router(localization.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(models.router, prefix=api_prefix)
app.include_router(simulation.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)

@app.on_event("startup")
def startup_event():
    logger.info("TrustSense-Gas API started.")
    logger.info(f"Loaded {len(model_registry._models_meta)} models from registry.")

@app.get("/")
def root():
    return {
        "name": "TrustSense-Gas Academic Research API",
        "status": "operational",
        "docs": "/docs",
        "version": "1.0.0",
        "disclaimer": SAFETY_DISCLAIMER
    }
