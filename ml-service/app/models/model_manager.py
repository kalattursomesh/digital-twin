import logging
from typing import List, Dict, Any
from collections import Counter
import random
# import numpy as np
# from sklearn.ensemble import RandomForestClassifier
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import Conv1D, MaxPooling1D, Flatten, Dense

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Manages loading, caching, and inference of ML models.
    In a fully production scenario, these models would be loaded from .h5 / .pkl files.
    This implementation handles feature extraction and runs simple heuristics/mocks 
    until enough data allows the trained models to take over.
    """
    def __init__(self):
        self.models = {}
        self.is_loaded = False

    def load_models(self):
        """Preload global models if necessary."""
        logger.info("Loading ML models...")
        # Simulate loading Random Forest & 1D CNN
        # self.models['rf'] = joblib.load('models/rf_model.pkl')
        self.is_loaded = True
        logger.info("Models loaded successfully.")

    def predict_next_action(self, user_id: str, activities: List[Any], current_hour: int, current_day: int) -> Dict[str, Any]:
        """Predict next action (Rule-based / Mocked RandomForest for now)."""
        if not activities:
            return {
                "prediction": "unknown",
                "confidence": 0.0,
                "probabilities": {}
            }
        
        # Extract features
        recent_types = [a.activityType for a in activities[:10]]
        type_counts = Counter(recent_types)
        total = sum(type_counts.values())
        
        # Add some heuristic prediction logic here
        most_common = type_counts.most_common(1)[0][0] if total > 0 else "unknown"
        confidence = (type_counts.most_common(1)[0][1] / total) if total > 0 else 0.0

        probs = {k: round(v/total, 2) for k, v in type_counts.items()}
        
        return {
            "prediction": most_common,
            "confidence": round(confidence, 2),
            "probabilities": probs
        }

    def predict_productivity(self, user_id: str, activities: List[Any]) -> Dict[str, Any]:
        """Predict user's productivity scores (Mocked 1D CNN time-series forecast)."""
        # We would convert activities to time-series sequences of productivity scores
        # and feed into 1D CNN layers for temporal feature extraction and forecasting.
        
        # Placeholder logic
        productive_types = ['study', 'work', 'coding', 'reading', 'exercise']
        
        hourly = {}
        for a in activities[:50]:
            h = a.hourOfDay
            is_prod = 1 if a.activityType in productive_types else 0
            if h not in hourly:
                hourly[h] = {"total": 0, "prod": 0}
            hourly[h]["total"] += 1
            hourly[h]["prod"] += is_prod
            
        best_hours = []
        for h, v in hourly.items():
            if v["total"] > 0:
                best_hours.append({"hour": h, "score": int((v["prod"]/v["total"]) * 10)})
        
        best_hours.sort(key=lambda x: x["score"], reverse=True)
        
        # Generate dummy 24-hour forecast curve
        forecast = [
            {"hour": f"{h}:00", "score": max(2, min(10, random.uniform(5, 9) if h in [bh["hour"] for bh in best_hours[:3]] else random.uniform(2, 6)))}
            for h in range(24)
        ]
        
        # Calculate overall score for recent activities
        recent = activities[:10]
        prod_count = sum(1 for a in recent if a.activityType in productive_types)
        score = (prod_count / len(recent)) * 10 if recent else 0.0
        
        return {
            "score": round(score, 1),
            "trend": "improving" if score >= 5.0 else "declining",
            "bestHours": best_hours[:5],
            "forecast": forecast
        }

    def analyze_behavior_clusters(self, user_id: str, activities: List[Any]) -> Dict[str, Any]:
        """Perform clustering to find typical user behavior patterns."""
        # Use KMeans logically here
        return {
            "cluster": "Deep Worker",
            "message": "You show focused 2-hour blocks usually in the mornings.",
            "characteristics": {
                "morning": "High focus",
                "afternoon": "Scattered",
                "distractibility": "Low"
            }
        }
