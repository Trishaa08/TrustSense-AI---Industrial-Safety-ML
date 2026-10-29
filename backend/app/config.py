from pathlib import Path
import os

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Configurable paths with reliable defaults
DATA_DIR_ENV = os.getenv("DATA_DIR")
if DATA_DIR_ENV and Path(DATA_DIR_ENV).exists():
    DATA_DIR = Path(DATA_DIR_ENV)
elif (BASE_DIR / "dataset").exists():
    DATA_DIR = BASE_DIR / "dataset"
elif (BASE_DIR / "TrustSense_Gas_Dataset").exists():
    DATA_DIR = BASE_DIR / "TrustSense_Gas_Dataset"
else:
    DATA_DIR = BASE_DIR / "dataset"

MODELS_DIR_ENV = os.getenv("MODELS_DIR")
if MODELS_DIR_ENV:
    MODELS_DIR = Path(MODELS_DIR_ENV)
else:
    MODELS_DIR = BACKEND_DIR / "saved_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

UPLOAD_DIR_ENV = os.getenv("UPLOAD_DIR")
if UPLOAD_DIR_ENV:
    UPLOAD_DIR = Path(UPLOAD_DIR_ENV)
else:
    UPLOAD_DIR = BACKEND_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# CORS origins
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000").split(",")

# Environment & Flags
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_DEMO_MODE = True
DATASET_PROVENANCE = "Synthetic Academic Development Dataset (TrustSense-Gas)"

# Safety Disclaimer
SAFETY_DISCLAIMER = (
    "DISCLAIMER: TrustSense-Gas is an academic research prototype. All data and localized results "
    "are based on synthetic models and must NEVER replace certified industrial gas alarms, certified safety interlocks, "
    "or emergency response protocols. A suspect or low-trust sensor must never suppress a safety alarm."
)
