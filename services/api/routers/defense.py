"""
Quarantine / Kill-Switch API — Automated and manual threat containment.

Provides endpoints to quarantine (isolate) and release internal nodes.
When a threat score exceeds the CRITICAL_THRESHOLD, the intelligence
pipeline can automatically trigger quarantine. Security analysts can
also manually quarantine/release nodes from the dashboard.

Architecture:
    Intelligence Engine → POST /v1/defense/quarantine  → node isolated
    Dashboard UI        → POST /v1/defense/quarantine  → manual override
    Dashboard UI        → POST /v1/defense/release     → restore access
    Dashboard UI        → GET  /v1/defense/quarantined → list isolated nodes
"""
import time
import threading
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger
from pkg.infra.audit_store import audit_store

router = APIRouter()


# ── Thread-safe in-memory quarantine store ──────────────────────────────
# In production: backed by Redis or a DB for persistence across restarts.
_quarantine_lock = threading.Lock()
_quarantined_nodes: Dict[str, dict] = {}

# Threshold: auto-quarantine if threat confidence exceeds this value
CRITICAL_THRESHOLD = 0.90


# ── Request/Response Models ─────────────────────────────────────────────
class QuarantineRequest(BaseModel):
    ip: str
    reason: str = "Manual quarantine by security analyst"
    threat_score: Optional[float] = None
    auto: bool = False  # True if triggered by ML pipeline

class ReleaseRequest(BaseModel):
    ip: str
    released_by: str = "security_analyst"

class QuarantineRecord(BaseModel):
    ip: str
    reason: str
    threat_score: Optional[float]
    quarantined_at: str
    auto_triggered: bool
    status: str  # "active" | "released"
    released_at: Optional[str] = None


# ── Quarantine Endpoints ────────────────────────────────────────────────
@router.post("/quarantine")
async def quarantine_node(req: QuarantineRequest):
    """
    Quarantine (isolate) an internal node.

    Can be triggered automatically by the ML pipeline when threat confidence
    exceeds CRITICAL_THRESHOLD, or manually by a security analyst.
    """
    with _quarantine_lock:
        if req.ip in _quarantined_nodes and _quarantined_nodes[req.ip]["status"] == "active":
            return {
                "status": "already_quarantined",
                "ip": req.ip,
                "message": f"Node {req.ip} is already in quarantine."
            }

        record = {
            "ip": req.ip,
            "reason": req.reason,
            "threat_score": req.threat_score,
            "quarantined_at": datetime.utcnow().isoformat(),
            "auto_triggered": req.auto,
            "status": "active",
            "released_at": None,
        }
        _quarantined_nodes[req.ip] = record

    trigger_type = "AUTO" if req.auto else "MANUAL"
    logger.warning(
        f"🛑 QUARANTINE [{trigger_type}]: Node {req.ip} isolated — "
        f"Reason: {req.reason} | Threat Score: {req.threat_score}"
    )
    
    # Write to immutable audit ledger
    audit_store.append(
        actor="Hunter ML Pipeline" if req.auto else "Security Analyst",
        action="QUARANTINE_NODE",
        resource=req.ip,
        details={
            "reason": req.reason,
            "threat_score": req.threat_score,
            "trigger": trigger_type
        }
    )

    return {
        "status": "quarantined",
        "ip": req.ip,
        "trigger": trigger_type,
        "message": f"Node {req.ip} has been quarantined successfully."
    }


@router.post("/release")
async def release_node(req: ReleaseRequest):
    """Release a quarantined node back to normal operation."""
    with _quarantine_lock:
        if req.ip not in _quarantined_nodes:
            raise HTTPException(status_code=404, detail=f"Node {req.ip} is not quarantined.")

        record = _quarantined_nodes[req.ip]
        if record["status"] == "released":
            return {
                "status": "already_released",
                "ip": req.ip,
                "message": f"Node {req.ip} was already released."
            }

        record["status"] = "released"
        record["released_at"] = datetime.utcnow().isoformat()

    logger.info(f"✅ RELEASE: Node {req.ip} restored by {req.released_by}")

    # Write to immutable audit ledger
    audit_store.append(
        actor=req.released_by,
        action="RELEASE_NODE",
        resource=req.ip,
        details={
            "reason": "Administrative override",
            "previous_status": "quarantined"
        }
    )

    return {
        "status": "released",
        "ip": req.ip,
        "message": f"Node {req.ip} has been released from quarantine."
    }


@router.get("/quarantined")
async def list_quarantined():
    """List all quarantined nodes (active and historical)."""
    with _quarantine_lock:
        active = [r for r in _quarantined_nodes.values() if r["status"] == "active"]
        released = [r for r in _quarantined_nodes.values() if r["status"] == "released"]

    return {
        "active_count": len(active),
        "total_historical": len(_quarantined_nodes),
        "active": active,
        "released": released[-10:],  # Last 10 released for audit trail
    }


@router.get("/status/{ip}")
async def quarantine_status(ip: str):
    """Check if a specific IP is quarantined."""
    with _quarantine_lock:
        record = _quarantined_nodes.get(ip)

    if not record:
        return {"ip": ip, "quarantined": False, "status": "clear"}

    return {
        "ip": ip,
        "quarantined": record["status"] == "active",
        "status": record["status"],
        "details": record,
    }


# ── Internal API: used by the intelligence pipeline ────────────────────
def is_quarantined(ip: str) -> bool:
    """Fast O(1) check if a node is currently quarantined."""
    with _quarantine_lock:
        record = _quarantined_nodes.get(ip)
        return record is not None and record["status"] == "active"


async def auto_quarantine_if_critical(ip: str, threat_score: float, reason: str = "") -> bool:
    """
    Called by the ML pipeline after inference.
    Auto-quarantines if score exceeds CRITICAL_THRESHOLD.

    Returns True if quarantine was triggered.
    """
    if threat_score < CRITICAL_THRESHOLD:
        return False

    if is_quarantined(ip):
        return False

    req = QuarantineRequest(
        ip=ip,
        reason=reason or f"Auto-quarantine: threat score {threat_score:.2%} exceeds threshold",
        threat_score=threat_score,
        auto=True,
    )
    await quarantine_node(req)
    return True
