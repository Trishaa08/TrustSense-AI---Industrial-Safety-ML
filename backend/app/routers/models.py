from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
from app.models.model_registry import model_registry
from app.models.train_pipeline import run_full_training

router = APIRouter(prefix="/models", tags=["Model Registry & Evaluation"])

@router.get("")
def list_models():
    """Lists all 7 diagnostic models, training status, and metrics."""
    return model_registry.list_all_models()

@router.get("/{model_id}/metrics")
def get_model_metrics(model_id: str):
    """Returns granular evaluation metrics, confusion matrix, and feature importances."""
    meta = model_registry.get_model_meta(model_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found in registry.")
    return meta

@router.post("/train")
def trigger_training(background_tasks: BackgroundTasks):
    """Triggers the full multi-model training pipeline."""
    # Run training
    res = run_full_training()
    return {
        "status": "completed",
        "message": "Full training pipeline completed successfully.",
        "details": res
    }
