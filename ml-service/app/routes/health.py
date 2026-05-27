from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    message: str

@router.get("/", response_model=HealthResponse)
async def health_check():
    """Check if the ML service is running."""
    return {"status": "ok", "message": "Digital Twin ML Service is online"}
