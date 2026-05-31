from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class ActivityFeatures(BaseModel):
    activityType: str
    category: str
    duration: int
    hourOfDay: int
    dayOfWeek: int
    isWeekend: bool
    sessionIndex: int
    timeSinceLastActivity: int
    productivityScore: int
    timestamp: datetime

class PredictionRequest(BaseModel):
    userId: str
    currentHour: Optional[int] = None
    currentDay: Optional[int] = None
    activities: List[ActivityFeatures]

class BestHourItem(BaseModel):
    hour: int
    score: int

class ForecastItem(BaseModel):
    hour: str
    score: float

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: Dict[str, float]
    source: str = "ml-model"

class ProductivityResponse(BaseModel):
    score: float
    trend: str
    bestHours: List[BestHourItem]
    forecast: List[ForecastItem]
    source: str = "ml-model"

class ClusterResponse(BaseModel):
    cluster: str
    message: str
    characteristics: Dict[str, str] = {}
