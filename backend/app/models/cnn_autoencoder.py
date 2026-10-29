import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader as TorchDataLoader, TensorDataset
import joblib
from pathlib import Path
from typing import Dict, Any, Tuple, List
from app.config import MODELS_DIR
import logging

logger = logging.getLogger("trustsense.models.autoencoder")
MODEL_PATH = MODELS_DIR / "cnn_autoencoder.pt"
METRICS_PATH = MODELS_DIR / "cnn_autoencoder_meta.joblib"

class Conv1DAutoencoderPyTorch(nn.Module):
    """1D-CNN Autoencoder for sensor response sequence / feature reconstruction."""
    def __init__(self, num_features: int = 17):
        super().__init__()
        # Encoder: 1D convolution over feature channels
        self.encoder = nn.Sequential(
            nn.Conv1d(1, 16, kernel_size=3, padding=1),
            nn.BatchNorm1d(16),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(16, 8, kernel_size=3, padding=1),
            nn.BatchNorm1d(8),
            nn.ReLU(),
        )
        # Latent space dimension
        encoded_dim = 8 * (num_features // 2)
        self.fc_enc = nn.Linear(encoded_dim, 12)
        self.fc_dec = nn.Linear(12, encoded_dim)

        # Decoder: ConvTranspose1d / Upsample back to original dimension
        self.decoder_conv = nn.Sequential(
            nn.Conv1d(8, 16, kernel_size=3, padding=1),
            nn.BatchNorm1d(16),
            nn.ReLU(),
            nn.Upsample(size=num_features, mode="nearest"),
            nn.Conv1d(16, 1, kernel_size=3, padding=1)
        )

    def forward(self, x):
        # x shape: (batch_size, num_features) -> expand to (batch_size, 1, num_features)
        x_in = x.unsqueeze(1)
        enc = self.encoder(x_in)
        flat = enc.view(enc.size(0), -1)
        latent = torch.relu(self.fc_enc(flat))
        
        dec_flat = torch.relu(self.fc_dec(latent))
        dec_reshaped = dec_flat.view(enc.size(0), 8, -1)
        out = self.decoder_conv(dec_reshaped)
        return out.squeeze(1)

class CNNAutoencoderSensorModel:
    """Model 3: 1D-CNN Autoencoder trained strictly on healthy sensor data."""
    def __init__(self, num_features: int = 17):
        self.num_features = num_features
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = Conv1DAutoencoderPyTorch(num_features).to(self.device)
        self.threshold: float = 0.5
        self.is_trained = False
        self.metrics: Dict[str, Any] = {}
        self.load()

    def train(self, X_train_healthy: np.ndarray,
              X_val_healthy: np.ndarray,
              X_test: np.ndarray,
              y_test_faulty: np.ndarray,
              epochs: int = 15,
              batch_size: int = 64) -> Dict[str, Any]:
        """
        Train strictly on healthy samples. 
        Calibrate anomaly threshold on held-out validation data (not test set).
        Evaluate anomaly recall and false alarm rate on test set.
        """
        logger.info(f"Training 1D-CNN Autoencoder on {len(X_train_healthy)} healthy samples...")
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.003, weight_decay=1e-5)
        criterion = nn.MSELoss()

        train_tensor = torch.tensor(X_train_healthy, dtype=torch.float32)
        dataset = TensorDataset(train_tensor)
        loader = TorchDataLoader(dataset, batch_size=batch_size, shuffle=True)

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0.0
            for batch in loader:
                inputs = batch[0].to(self.device)
                optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = criterion(outputs, inputs)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

        self.is_trained = True

        # Validation step: Compute threshold on validation healthy data (95th percentile)
        val_errors = self.compute_reconstruction_errors(X_val_healthy)
        self.threshold = float(np.percentile(val_errors, 95))
        logger.info(f"Anomaly threshold set to 95th percentile of validation healthy errors: {self.threshold:.4f}")

        # Test evaluation: labeled test set
        test_errors = self.compute_reconstruction_errors(X_test)
        test_anom_preds = (test_errors > self.threshold).astype(int)

        # Metrics
        tp = int(np.sum((test_anom_preds == 1) & (y_test_faulty == 1)))
        fp = int(np.sum((test_anom_preds == 1) & (y_test_faulty == 0)))
        tn = int(np.sum((test_anom_preds == 0) & (y_test_faulty == 0)))
        fn = int(np.sum((test_anom_preds == 0) & (y_test_faulty == 1)))

        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        false_alarm_rate = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0

        # Sample reconstruction curve for plotting
        sample_input = X_test[0:1]
        sample_recon = self.reconstruct(sample_input)[0]

        self.metrics = {
            "model_type": "1D-CNN Sequence Autoencoder (PyTorch)",
            "anomaly_threshold": self.threshold,
            "validation_healthy_samples": len(X_val_healthy),
            "test_samples": len(X_test),
            "anomaly_recall": recall,
            "false_alarm_rate": false_alarm_rate,
            "precision": precision,
            "confusion": {"TP": tp, "FP": fp, "TN": tn, "FN": fn},
            "sample_original_curve": sample_input[0].tolist(),
            "sample_reconstructed_curve": sample_recon.tolist(),
            "mean_healthy_error": float(np.mean(val_errors)),
            "mean_test_faulty_error": float(np.mean(test_errors[y_test_faulty == 1])) if np.sum(y_test_faulty == 1) > 0 else 0.0
        }

        # Save artifacts
        torch.save(self.model.state_dict(), MODEL_PATH)
        joblib.dump({"threshold": self.threshold, "metrics": self.metrics}, METRICS_PATH)
        logger.info(f"1D-CNN Autoencoder saved. Recall: {recall:.4f}, FAR: {false_alarm_rate:.4f}")
        return self.metrics

    def compute_reconstruction_errors(self, X: np.ndarray) -> np.ndarray:
        """Computes MSE reconstruction error per sample."""
        self.model.eval()
        with torch.no_grad():
            tensor_x = torch.tensor(X, dtype=torch.float32).to(self.device)
            recon = self.model(tensor_x)
            mse = torch.mean((recon - tensor_x) ** 2, dim=1).cpu().numpy()
        return mse

    def reconstruct(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        with torch.no_grad():
            tensor_x = torch.tensor(X, dtype=torch.float32).to(self.device)
            recon = self.model(tensor_x).cpu().numpy()
        return recon

    def predict_anomalies(self, X: np.ndarray, custom_threshold: float = None) -> Tuple[np.ndarray, np.ndarray]:
        """Returns boolean anomaly flags and MSE errors."""
        thresh = custom_threshold if custom_threshold is not None else self.threshold
        errors = self.compute_reconstruction_errors(X)
        is_anomaly = errors > thresh
        return is_anomaly, errors

    def load(self) -> bool:
        if MODEL_PATH.exists() and METRICS_PATH.exists():
            try:
                self.model.load_state_dict(torch.load(MODEL_PATH, map_location=self.device, weights_only=True))
                meta = joblib.load(METRICS_PATH)
                self.threshold = meta.get("threshold", 0.5)
                self.metrics = meta.get("metrics", {})
                self.is_trained = True
                return True
            except Exception as e:
                logger.warning(f"Could not load 1D-CNN Autoencoder: {e}")
        return False
