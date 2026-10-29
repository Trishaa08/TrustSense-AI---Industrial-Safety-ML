# TrustSense-Gas: Fault-Aware Gas-Leak Monitoring & Reliability-Weighted Spatial Localization

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.4+-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1+-EB5424.svg)](https://xgboost.readthedocs.io/)
[![License](https://img.shields.io/badge/License-Academic_Research-blue.svg)](#)

An academic research prototype demonstrating **fault-aware gas monitoring, sensor degradation diagnosis, and reliability-weighted spatial localization** under synthetic sensor degradation.

> **CRITICAL SAFETY NOTICE:**
> TrustSense-Gas is strictly an academic research prototype. It must **NEVER** replace, silence, disable, or override certified industrial gas detectors, emergency interlocks, or facility safety protocols. Suspect sensor readings must never suppress an active gas alarm.

---

## 1. Research Hypothesis & Core Innovation

Conventional spatial gas localization algorithms assume all sensor readings are accurate and healthy. When a physical sensor experiences **bias offset, baseline drift, stuck values, increased noise, or sluggish response**, standard centroid calculations become severely corrupted, pulling the estimated leak source toward the faulty sensor.

**TrustSense-Gas evaluates a 7-component diagnostic pipeline:**
1. **Random Forest Classifier**: Supervised classification of healthy vs. degraded sensor windows.
2. **XGBoost Multi-Class Classifier**: Pinpoints fault categories (`none`, `offset`, `slow_response`, `noise_increase`, `sensitivity_loss`, `drift`, `stuck`).
3. **1D-CNN Autoencoder (PyTorch)**: Learns healthy temporal pulse responses; flags anomalies exceeding the 95th-percentile validation reconstruction error ($0.0264$).
4. **Isolation Forest**: Detects unsupervised multidimensional feature space outliers.
5. **Statistical Change Detectors (EWMA & CUSUM)**: Identifies persistent baseline shifts and sensor degradation.
6. **K-Nearest Neighbors (KNN)**: Compares standardized feature vectors against calibrated reference profiles ($k=7$).
7. **Calibrated Evidence-Fusion Meta-Classifier**: Combines all base diagnostic probabilities using Platt calibration (Brier score $0.0048$) to produce a transparent $0\text{--}100$ Sensor Trust Score.

---

## 2. Benchmark Evaluation Results

Evaluated on held-out test partitions strictly grouped by hardware unit (`split_units` / `unit_id`) with **zero temporal or hardware leakage**:

| Diagnostic Component | Role | Evaluation Metric | Result |
| :--- | :--- | :--- | :--- |
| **Random Forest** | Binary Health Detection | Test F1-Score / Balanced Acc | **0.9940 / 0.9950** |
| **XGBoost (Native)** | 7-Class Fault Identification | Multi-Class Accuracy / Macro-F1 | **0.8328 / 0.6130** |
| **1D-CNN Autoencoder** | Unsupervised Temporal Anomaly | Anomaly Recall / False Alarm Rate | **0.8962 / 0.0456** |
| **Isolation Forest** | Feature Outlier Detection | Unsupervised Outlier Recall | **0.2659** |
| **KNN Classifier** | Reference Pattern Matcher | Test F1-Score ($k=7$) | **0.9839** |
| **Calibrated Fusion** | Evidence Meta-Classifier | Brier Score / Fusion F1 | **0.0048 / 0.9930** |

### Localization Performance Under Sensor Faults
* **Ordinary Centroid (All Sensors Unweighted)**: Mean localization error **$6.84\text{ m}$**.
* **TrustSense Fault-Aware (Reliability-Weighted Centroid)**: Mean localization error **$2.12\text{ m}$** (**$69\%$ error reduction**).

---

## 3. Technology Stack

* **Backend**: Python 3.11+, FastAPI, PyTorch (1D-CNN Autoencoder), Scikit-Learn, XGBoost, Pandas, NumPy, Pydantic v2.
* **Frontend**: React 19, TypeScript, Vite, Recharts, Lucide Icons, Pure CSS Modern Industrial Cyberpunk Design System.
* **Storage**: Bundled synthetic datasets under `dataset/` (38,880 hourly windows, 23,040 minute-level timeseries samples, 30 ground-truth leak events).

---

## 4. Quick Start & Setup

### Prerequisites
* Python 3.11, 3.12, or 3.13
* Node.js v18+ and npm

### A. Windows PowerShell Setup

```powershell
# 1. Clone or navigate to the project directory
cd D:\Trustsensi-Ai-ml

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. (Optional) Run full reproducible model training pipeline
cd backend
python -m app.models.train_pipeline
cd ..

# 4. Start the FastAPI Backend server (Port 8000)
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# (Keep this terminal open)

# 5. In a second PowerShell window, install and launch the frontend (Port 5173)
cd D:\Trustsensi-Ai-ml\frontend
npm.cmd install
npm.cmd run dev
```

### B. Git Bash / macOS / Linux Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m app.models.train_pipeline
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (in another terminal)
cd ../frontend
npm install
npm run dev
```

---

## 5. Local Access URLs

* **Interactive Frontend Dashboard**: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
* **Interactive FastAPI Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc API Specifications**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **Backend Health Check**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## 6. Application Pages & Features

The platform provides 10 interactive views:

1. **Overview Dashboard** (`/`): KPI tiles (Gas Event, Network Health, Spatial Uncertainty, Status), real-time gas trend charts, Top-5 health meters, and facility floorplan preview.
2. **Live Playback** (`/playback`): 48-hour minute-by-minute historical simulation scrubber (2,880 timesteps), synchronized multi-sensor cards, speed controls (0.5x to 10x), and animated leak markers.
3. **Gas Leak Map** (`/leak-map`): Interactive spatial floorplan with candidate leak pin, circular uncertainty error radius ($\pm 3.2\text{ m}$), method toggles (Ordinary vs. Fault-Aware vs. Hard Filtered), and Euclidean error computation against all 30 ground-truth leak incidents.
4. **Sensor Health & Trust** (`/sensor-health`): Complete 16-sensor matrix, trust score decomposition into 5 penalty categories, and interactive scoring engine weight sliders with live backend persistence.
5. **Fault Diagnostics** (`/fault-diagnostics`): Response/Recovery Fingerprint (RFE) curves comparing healthy baseline reference profiles against current sensor pulses; key physical indicators ($+42\%$ response time, $+28\%$ recovery time, $+12\%$ drift); and 1D-CNN autoencoder reconstruction error timeline.
6. **Leak Investigation** (`/leak-investigation`): Forensic dossier per incident, ablation proof demonstrating how fault-awareness prevents spatial dragging, and mandatory safety procedure alerts.
7. **ML Models & Research** (`/model-performance`): Interactive Confusion Matrix heatmap, per-class metrics, Gini/SHAP feature importance rankings, and one-click full pipeline retrain button.
8. **Alerts & History** (`/alerts`): Filterable alert log, analyst acknowledgment signature modal, audit trail, and CSV export.
9. **Data Management** (`/data-management`): Repository of all 9 bundled datasets, interactive paginated CSV viewer, schema preview, and safe isolated CSV upload with schema validation.
10. **Settings & Info** (`/settings`): Detection sensitivity, EWMA $\alpha$, CUSUM thresholds, minimum reliable sensors, backend API latency diagnostics, and reset to defaults.

---

## 7. Running Backend Automated Tests

All 23 backend tests validate schema integrity, leakage prevention, trust scoring, and localization contracts:

```powershell
cd D:\Trustsensi-Ai-ml\backend
python -m pytest tests -v
```

Output:
```
tests/test_api.py ........               PASSED
tests/test_data_loader.py ......         PASSED
tests/test_feature_pipeline.py ...       PASSED
tests/test_localization.py ...           PASSED
tests/test_trust_score.py ...            PASSED
======================= 23 passed in 6.17s =======================
```

---

## 8. Dataset Limitations & Provenance

* **Synthetic Benchmark**: All data files (`sensor_windows.csv`, `sensor_positions.csv`, `leak_ground_truth.csv`, etc.) are synthetic datasets designed for algorithm benchmarking.
* **Prohibited Columns**: `true_gas_ppm_simulated`, `gas_event`, `is_faulty`, `fault_type`, and `label_state` are strictly barred from inference features to prevent target leakage.
* **Plume Dispersion**: Heatmaps are visual inverse-distance weighting interpolations, not computational fluid dynamics (CFD) gas plume simulations.

---

## 9. Troubleshooting Guide

* **PowerShell Execution Policy Error (`PSSecurityException`)**:
  If PowerShell blocks `npm`, run `npm.cmd` instead:
  ```powershell
  npm.cmd run dev
  ```
* **Missing `python-multipart`**:
  If form data or upload fails, install via:
  ```powershell
  pip install python-multipart
  ```
* **Port Conflict on 8000 or 5173**:
  Check for active processes:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess
  ```
