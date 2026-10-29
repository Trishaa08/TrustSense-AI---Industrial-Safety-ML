from typing import Dict, Any, Optional
from pathlib import Path
import json
import logging
from app.config import MODELS_DIR, DATASET_PROVENANCE

logger = logging.getLogger("trustsense.registry")

class ModelRegistry:
    """Central registry holding metadata, metrics, and references to all 7 models."""
    _instance = None
    _models_meta: Dict[str, Dict[str, Any]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
            cls._models_meta = {}
            cls._instance._load_persisted_metrics()
        return cls._instance

    def _load_persisted_metrics(self):
        metrics_file = MODELS_DIR / "evaluation_metrics.json"
        if metrics_file.exists():
            try:
                with open(metrics_file, "r") as f:
                    self._models_meta = json.load(f)
                logger.info("Loaded persisted model evaluation metrics.")
            except Exception as e:
                logger.warning(f"Could not load evaluation_metrics.json: {e}")

    def save_metrics(self):
        metrics_file = MODELS_DIR / "evaluation_metrics.json"
        try:
            with open(metrics_file, "w") as f:
                json.dump(self._models_meta, f, indent=2)
            logger.info("Saved evaluation metrics.")
        except Exception as e:
            logger.error(f"Failed to save metrics: {e}")

    def register_model(self, model_id: str, meta: Dict[str, Any]):
        self._models_meta[model_id] = meta
        self.save_metrics()

    def get_model_meta(self, model_id: str) -> Optional[Dict[str, Any]]:
        return self._models_meta.get(model_id)

    def list_all_models(self) -> Dict[str, Any]:
        return {
            "models": list(self._models_meta.values()),
            "timestamp": "2026-10-20T18:00:00Z",
            "data_provenance": DATASET_PROVENANCE
        }

model_registry = ModelRegistry()
