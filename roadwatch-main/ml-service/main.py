from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import List
import math
from datetime import datetime

app = FastAPI(title="RoadWatch ML Intelligence API")

# ----------------- DUPLICATE DETECTION (CLIP) -----------------
class DuplicateCheckRequest(BaseModel):
    new_embedding: List[float]
    existing_embeddings: List[List[float]]

def cosine_similarity(v1, v2):
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a * a for a in v1))
    norm_v2 = math.sqrt(sum(b * b for b in v2))
    return dot_product / (norm_v1 * norm_v2) if (norm_v1 * norm_v2) > 0 else 0

@app.post("/detect-duplicate")
def detect_duplicate(req: DuplicateCheckRequest):
    """
    Called by Node backend when a complaint is 20m - 100m away from existing ones.
    Compares the generated CLIP embedding of the new photo against existing embeddings.
    """
    for i, existing_emb in enumerate(req.existing_embeddings):
        sim = cosine_similarity(req.new_embedding, existing_emb)
        if sim > 0.85:
            return {"status": "duplicate_found", "similarity": sim, "match_index": i}
    return {"status": "unique"}

# ----------------- PREDICTIVE FAILURE (Scikit-Learn RF Mock) -----------------
class RoadData(BaseModel):
    days_since_repair: int
    road_type: str
    contractor_failure_freq: float
    avg_rainfall_30d: float
    traffic_load: int
    complaints_90d: int
    in_warranty: bool

@app.post("/predict-failure")
def predict_failure(data: RoadData):
    """
    Predicts road failure probability using features.
    In production, this loads a pickled RandomForestClassifier.
    """
    # Mock ML Inference Logic based on features
    risk = 0.1
    if data.days_since_repair > 1000: risk += 0.2
    if data.avg_rainfall_30d > 100: risk += 0.3
    if data.contractor_failure_freq > 30: risk += 0.2
    if data.complaints_90d > 5: risk += 0.2
    if data.road_type in ['VR', 'ODR']: risk += 0.1
    if data.in_warranty: risk -= 0.1
    
    prob = min(max(risk, 0.0), 1.0)
    
    return {
        "failure_probability": round(prob, 2),
        "high_risk": prob > 0.7,
        "estimated_failure_days": int((1.0 - prob) * 365) if prob < 1 else 10
    }

# ----------------- DASHCAM YOLOv8 ANALYSIS -----------------
@app.post("/analyze-dashcam")
async def analyze_dashcam(video: UploadFile = File(...)):
    """
    Receives dashcam MP4, processes frame-by-frame with YOLOv8.
    Returns timestamped detections to auto-draft complaints.
    """
    # Mock YOLOv8 detection output
    detections = [
        {"timestamp": 12.5, "issue_type": "pothole", "confidence": 0.92, "estimated_lat": 19.0760, "estimated_lng": 72.8777},
        {"timestamp": 45.2, "issue_type": "faded_markings", "confidence": 0.88, "estimated_lat": 19.0765, "estimated_lng": 72.8780},
        {"timestamp": 110.0, "issue_type": "waterlogging", "confidence": 0.95, "estimated_lat": 19.0770, "estimated_lng": 72.8790}
    ]
    return {
        "status": "success",
        "video_duration_processed": 120.0,
        "detections": detections
    }
