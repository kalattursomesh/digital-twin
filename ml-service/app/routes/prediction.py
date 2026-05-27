from fastapi import APIRouter, HTTPException, Request
from ..schemas import PredictionRequest, PredictionResponse, ProductivityResponse, ClusterResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/next-action", response_model=PredictionResponse)
async def predict_next_action(request: Request, data: PredictionRequest):
    """Predict the user's next logical action based on history."""
    try:
        model_manager = request.app.state.model_manager
        prediction = model_manager.predict_next_action(
            data.userId, data.activities, data.currentHour, data.currentDay
        )
        return prediction
    except Exception as e:
        logger.error(f"Error predicting next action: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction failed")

@router.post("/productivity", response_model=ProductivityResponse)
async def predict_productivity(request: Request, data: PredictionRequest):
    """Forecast user's productivity trend and find optimal focus hours."""
    try:
        model_manager = request.app.state.model_manager
        prediction = model_manager.predict_productivity(data.userId, data.activities)
        return prediction
    except Exception as e:
        logger.error(f"Error predicting productivity: {str(e)}")
        raise HTTPException(status_code=500, detail="Productivity prediction failed")

@router.post("/clusters", response_model=ClusterResponse)
async def analyze_clusters(request: Request, data: PredictionRequest):
    """Analyze user behavior patterns using K-Means clustering."""
    try:
        model_manager = request.app.state.model_manager
        cluster_info = model_manager.analyze_behavior_clusters(data.userId, data.activities)
        return cluster_info
    except Exception as e:
        logger.error(f"Error in cluster analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Cluster analysis failed")
