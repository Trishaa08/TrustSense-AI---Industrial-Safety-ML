from fastapi import APIRouter, HTTPException, Query, Response
from typing import Dict, Any, List, Optional
import pandas as pd
import io
from app.schemas import AcknowledgeRequest
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
def get_alerts(
    severity: Optional[str] = Query("all"),
    sensor_id: Optional[str] = Query("all"),
    alert_type: Optional[str] = Query("all"),
    status: Optional[str] = Query("all")
):
    """Retrieves filterable alerts and audit trail."""
    alerts = alert_service.get_alerts(
        severity=severity,
        sensor_id=sensor_id,
        alert_type=alert_type,
        status=status
    )
    return {"alerts": alerts, "total_count": len(alerts)}

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, req: AcknowledgeRequest):
    """Updates alert status with analyst signature and notes."""
    updated = alert_service.acknowledge_alert(
        alert_id=alert_id,
        new_status=req.status,
        analyst_name=req.analyst_name,
        notes=req.notes or ""
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")
    return {"success": True, "alert": updated}

@router.get("/export/csv")
def export_alerts_csv():
    """Exports alert log as downloadable CSV file."""
    alerts = alert_service.get_alerts()
    df = pd.DataFrame(alerts)
    if "audit_trail" in df.columns:
        df["audit_trail"] = df["audit_trail"].apply(lambda x: str(x))
    
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trustsense_alerts.csv"}
    )
