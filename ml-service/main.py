"""
Digital Twin ML Service - Main Application
FastAPI server providing behavior prediction, productivity scoring,
and anomaly detection via trained ML models.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from app.routes import prediction, training, health
from app.models.model_manager import ModelManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global model manager
model_manager = ModelManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 Starting Digital Twin ML Service...")
    model_manager.load_models()
    app.state.model_manager = model_manager
    logger.info("✅ ML Service ready")
    yield
    logger.info("🛑 Shutting down ML Service...")


app = FastAPI(
    title="Digital Twin ML Service",
    description="AI/ML service for behavior prediction and productivity analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, tags=["Health"])
app.include_router(prediction.router, prefix="/predict", tags=["Prediction"])
app.include_router(training.router, prefix="/train", tags=["Training"])
