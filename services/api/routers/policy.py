from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# In-memory alert store (shared across the app)
_alerts_store: List[dict] = []

def add_alert(alert: dict):
    """Called by the analyzer to push alerts."""
    _alerts_store.append(alert)
    # Keep last 100 alerts
    if len(_alerts_store) > 100:
        _alerts_store.pop(0)

def get_alerts_store() -> List[dict]:
    return _alerts_store

@router.get("/alerts")
async def get_alerts():
    """
    Get active security alerts from the live store.
    """
    return _alerts_store

@router.post("/scan")
async def trigger_scan():
    """
    Manually trigger an active interrogation scan.
    """
    return {"status": "scan_initiated", "job_id": "job-123"}
