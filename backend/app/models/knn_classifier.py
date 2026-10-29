from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, List
from app.config import MODELS_DIR
import logging

logger = logging.getLogger("trustsense.models.knn")
MODEL_PATH = MODELS_DIR / "knn_classifier.joblib"

class KNNExemplarClassifier:
    """Model 6: K-Nearest Neighbors Reference-Exemplar Classifier with cross-validated k."""
    def __init__(self, k: int = 7):
        self.k = k
        self.model = KNeighborsClassifier(n_neighbors=k, weights="distance", metric="euclidean")
        self.is_trained = False
        self.metrics: Dict[str, Any] = {}
        self.reference_samples: np.ndarray = np.array([])
        self.reference_labels: np.ndarray = np.array([])
        self.load()

    def train(self, X_train: np.ndarray, y_train_faulty: np.ndarray,
              X_val: np.ndarray, y_val_faulty: np.ndarray,
              X_test: np.ndarray, y_test_faulty: np.ndarray) -> Dict[str, Any]:
        """Validates optimal k on validation split, then evaluates on held-out test split."""
        logger.info(f"Tuning and training KNN Classifier on {len(X_train)} samples...")
        
        # Subsample reference pool if train is very large for rapid nearest-neighbor lookup
        max_pool = 4000
        if len(X_train) > max_pool:
            np.random.seed(42)
            idx = np.random.choice(len(X_train), max_pool, replace=False)
            X_pool = X_train[idx]
            y_pool = y_train_faulty[idx]
        else:
            X_pool = X_train
            y_pool = y_train_faulty

        best_k = 7
        best_val_f1 = 0.0
        # Evaluate k in [3, 5, 7, 11]
        for candidate_k in [3, 5, 7, 11]:
            candidate_knn = KNeighborsClassifier(n_neighbors=candidate_k, weights="distance")
            candidate_knn.fit(X_pool, y_pool)
            val_preds = candidate_knn.predict(X_val[:1000])  # fast validation check
            f1 = f1_score(y_val_faulty[:1000], val_preds, zero_division=0)
            if f1 > best_val_f1:
                best_val_f1 = f1
                best_k = candidate_k

        self.k = best_k
        self.model = KNeighborsClassifier(n_neighbors=best_k, weights="distance")
        self.model.fit(X_pool, y_pool)
        self.reference_samples = X_pool
        self.reference_labels = y_pool
        self.is_trained = True

        # Test evaluation
        test_preds = self.model.predict(X_test)
        test_probs = self.model.predict_proba(X_test)[:, 1]
        acc = float(accuracy_score(y_test_faulty, test_preds))
        f1 = float(f1_score(y_test_faulty, test_preds, zero_division=0))
        cm = confusion_matrix(y_test_faulty, test_preds).tolist()

        self.metrics = {
            "model_type": f"K-Nearest Neighbors (k={self.k}, Distance-Weighted)",
            "validated_k": self.k,
            "best_validation_f1": float(best_val_f1),
            "test_accuracy": acc,
            "test_f1": f1,
            "confusion_matrix": cm,
            "reference_pool_size": len(X_pool),
            "test_sample_count": len(X_test)
        }

        joblib.dump({
            "model": self.model,
            "metrics": self.metrics,
            "k": self.k,
            "pool_size": len(X_pool)
        }, MODEL_PATH)
        logger.info(f"KNN trained with optimal k={self.k}. Test F1: {f1:.4f}")
        return self.metrics

    def find_nearest_neighbors(self, X: np.ndarray, n_neighbors: int = 3) -> Tuple[np.ndarray, np.ndarray]:
        """Returns distances and indices of nearest reference patterns."""
        if not self.is_trained:
            raise RuntimeError("KNN Classifier is not trained.")
        distances, indices = self.model.kneighbors(X, n_neighbors=n_neighbors)
        return distances, indices

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        if not self.is_trained:
            raise RuntimeError("KNN Classifier is not trained.")
        preds = self.model.predict(X)
        probs = self.model.predict_proba(X)[:, 1]
        return preds, probs

    def load(self) -> bool:
        if MODEL_PATH.exists():
            try:
                data = joblib.load(MODEL_PATH)
                self.model = data["model"]
                self.metrics = data.get("metrics", {})
                self.k = data.get("k", 7)
                self.is_trained = True
                return True
            except Exception as e:
                logger.warning(f"Could not load KNN model: {e}")
        return False
