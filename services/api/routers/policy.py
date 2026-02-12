from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class Alert(BaseModel):
    id: str
    severity: str
    description: str
    timestamp: str

@router.get("/alerts", response_model=list[Alert])
async def get_alerts():
    """
    Get active security alerts.
    """
    return [
        Alert(
            id="alert-101",
            severity="HIGH",
            description="Unauthorized outbound connection to unknown IP 10.0.0.5",
            timestamp="2023-10-27T10:00:00Z"
        )
    ]

@router.post("/scan")
async def trigger_scan():
    """
    Manually trigger an active interrogation scan.
    """
    return {"status": "scan_initiated", "job_id": "job-123"}
