from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from typing import Dict, Any, List
import pandas as pd
from pathlib import Path
from app.data_loader import data_loader
from app.config import UPLOAD_DIR
import logging

router = APIRouter(prefix="/datasets", tags=["Datasets"])
logger = logging.getLogger("trustsense.routers.datasets")

@router.get("")
def list_datasets():
    """Lists all available datasets with row counts and provenance."""
    return {"datasets": data_loader.list_datasets()}

@router.get("/preview")
def get_dataset_preview(
    filename: str = Query(..., description="Target CSV filename"),
    limit: int = Query(50, ge=1, le=500),
    is_uploaded: bool = Query(False)
):
    """Returns dataset summary preview, dtypes, missing values, and rows."""
    try:
        preview = data_loader.get_preview(filename, limit=limit, is_uploaded=is_uploaded)
        return preview
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Dataset file '{filename}' not found.")
    except Exception as e:
        logger.error(f"Error previewing dataset {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads and validates a CSV file into isolated upload storage."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    safe_filename = Path(file.filename).name
    target_path = UPLOAD_DIR / safe_filename

    # Read and validate
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit.")

    try:
        # Write to disk
        with open(target_path, "wb") as f:
            f.write(content)

        # Validate CSV parsing
        df = pd.read_csv(target_path)
        return {
            "success": True,
            "filename": safe_filename,
            "rows_parsed": len(df),
            "detected_columns": list(df.columns),
            "message": f"Successfully validated and uploaded '{safe_filename}' ({len(df):,} rows)."
        }
    except Exception as e:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
