from fastapi import APIRouter, HTTPException, Query, Response
from app.services.report_service import report_service
from app.data_loader import data_loader
import pandas as pd
import io

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/investigation/{leak_id}")
def get_investigation_report(leak_id: str):
    """Generates complete leak event investigation dossier."""
    return report_service.generate_investigation_report(leak_id)

@router.get("/export/csv")
def export_dataset_csv(filename: str = Query("sensor_positions.csv")):
    """Downloads permitted CSV dataset."""
    try:
        df = data_loader.load_csv(filename)
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        return Response(
            content=stream.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Dataset {filename} not exportable: {e}")
