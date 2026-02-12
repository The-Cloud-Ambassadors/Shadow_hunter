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

@router.get("/report")
async def generate_report():
    """
    Generate a Shadow AI usage report from current alert data.
    Returns a JSON summary suitable for display or export.
    """
    from collections import Counter
    from datetime import datetime
    
    alerts = _alerts_store
    total = len(alerts)
    
    # Severity breakdown
    sev_counts = Counter(a.get("severity", "LOW") for a in alerts)
    
    # Unique source IPs
    sources = Counter(a.get("source", "unknown") for a in alerts)
    
    # Unique destinations
    targets = Counter(a.get("target", "unknown") for a in alerts)
    
    # Shadow AI specific (from descriptions containing known patterns)
    shadow_alerts = [a for a in alerts if "Shadow AI" in a.get("description", "") or "shadow_ai" in str(a.get("ml_metadata", {}))]
    
    # Top offending IPs
    top_sources = sources.most_common(10)
    top_targets = targets.most_common(10)
    
    return {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_alerts": total,
            "shadow_ai_alerts": len(shadow_alerts),
            "unique_sources": len(sources),
            "unique_targets": len(targets),
        },
        "severity_breakdown": {
            "HIGH": sev_counts.get("HIGH", 0),
            "MEDIUM": sev_counts.get("MEDIUM", 0),
            "LOW": sev_counts.get("LOW", 0),
        },
        "top_sources": [{"ip": ip, "alert_count": c} for ip, c in top_sources],
        "top_targets": [{"ip": ip, "alert_count": c} for ip, c in top_targets],
        "shadow_ai_details": shadow_alerts[:20],
        "recommendations": [
            "Review high-severity alerts for unauthorized AI service usage",
            "Update firewall rules to block or monitor flagged AI domains",
            "Investigate top offender IPs for policy compliance",
            "Consider implementing endpoint DLP for AI data exfiltration prevention",
        ],
    }
