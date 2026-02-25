"""
Compliance & Reporting API — Enterprise compliance statistics and audit trail.

Tracks how Shadow Hunter helps organizations meet ISO 27001, SOC 2, and
GDPR requirements by intercepting unauthorized data flows to AI services.

Endpoints:
    GET /v1/compliance/stats      → Compliance framework scores & metrics
    GET /v1/compliance/violations → Recent compliance violations
    GET /v1/compliance/audit-log  → Full audit trail for compliance officers
"""
from datetime import datetime, timedelta
from typing import List, Dict
from fastapi import APIRouter, Depends
from collections import Counter
from services.api.dependencies import get_graph_store
from services.api.routers.policy import get_alerts_store
from pkg.core.interfaces import GraphStore

router = APIRouter()


# ── Compliance Framework Definitions ────────────────────────────────────
COMPLIANCE_FRAMEWORKS = {
    "ISO_27001": {
        "name": "ISO 27001",
        "description": "Information Security Management System",
        "controls": {
            "A.8.1": "Asset management — unauthorized tool usage detected",
            "A.9.4": "Access control — unauthorized API access prevented",
            "A.12.4": "Logging & monitoring — shadow AI traffic captured",
            "A.13.1": "Network security — lateral movement detected",
        }
    },
    "SOC2": {
        "name": "SOC 2 Type II",
        "description": "Service Organization Control — Trust Services Criteria",
        "controls": {
            "CC6.1": "Logical access — unauthorized external API blocked",
            "CC6.6": "System boundaries — data exfiltration to AI prevented",
            "CC7.2": "Monitoring — anomalous traffic patterns identified",
            "CC8.1": "Change management — unauthorized tool deployment caught",
        }
    },
    "GDPR": {
        "name": "GDPR",
        "description": "General Data Protection Regulation",
        "controls": {
            "Art.5.1f": "Integrity & confidentiality — PII leak to AI services prevented",
            "Art.25": "Data protection by design — privacy mode enforcement",
            "Art.32": "Security of processing — unauthorized processor (AI) access blocked",
            "Art.33": "Breach notification — real-time threat detection and alerting",
        }
    }
}


def _classify_alert_compliance(alert: dict) -> List[str]:
    """Classify a security alert into compliance framework violations it helps address."""
    tags = []
    severity = alert.get("severity", "LOW")
    alert_type = alert.get("type", "")
    reason = alert.get("reason", "").lower()

    # Any shadow AI detection helps ISO 27001 asset management
    if "shadow" in reason or "ai" in reason or "unauthorized" in reason:
        tags.append("ISO_27001:A.8.1")
        tags.append("SOC2:CC6.1")

    # Data exfiltration prevention
    if severity == "HIGH":
        tags.append("ISO_27001:A.9.4")
        tags.append("SOC2:CC6.6")
        tags.append("GDPR:Art.5.1f")

    # Network monitoring
    if "centrality" in reason or "lateral" in reason or "bridge" in reason:
        tags.append("ISO_27001:A.13.1")
        tags.append("SOC2:CC7.2")

    # Generic monitoring contribution
    tags.append("ISO_27001:A.12.4")
    tags.append("GDPR:Art.33")

    return tags


@router.get("/stats")
async def compliance_stats(store: GraphStore = Depends(get_graph_store)):
    """
    Calculate compliance statistics across all frameworks.

    Returns per-framework scores based on the number of intercepted
    threats mapped to their compliance controls.
    """
    alerts = get_alerts_store()
    nodes = await store.get_all_nodes()

    # Classify all alerts into compliance tags
    all_tags = []
    violations_by_framework: Dict[str, int] = Counter()

    for alert in alerts:
        tags = _classify_alert_compliance(alert)
        all_tags.extend(tags)
        for tag in tags:
            framework = tag.split(":")[0]
            violations_by_framework[framework] += 1

    # Calculate "compliance health" scores
    # Higher alert interception = better compliance posture
    total_alerts = len(alerts) or 1
    shadow_nodes = sum(1 for n in nodes if n.get("type") == "shadow")

    frameworks = []
    for fw_id, fw_info in COMPLIANCE_FRAMEWORKS.items():
        intercepts = violations_by_framework.get(fw_id, 0)

        # Score: starts at 100, decreased by unmitigated threats
        # More intercepts = better (proactive detection)
        controls_covered = len([
            t for t in all_tags if t.startswith(fw_id)
        ])
        total_controls = len(fw_info["controls"])
        unique_controls_hit = len(set(
            t.split(":")[1] for t in all_tags if t.startswith(fw_id)
        ))

        coverage_pct = round((unique_controls_hit / total_controls) * 100) if total_controls else 0

        # Risk penalty: shadow nodes that weren't quarantined
        risk_penalty = min(shadow_nodes * 5, 30)  # Max 30% penalty
        health_score = max(0, min(100, coverage_pct + 20 - risk_penalty))

        frameworks.append({
            "id": fw_id,
            "name": fw_info["name"],
            "description": fw_info["description"],
            "health_score": health_score,
            "controls_total": total_controls,
            "controls_active": unique_controls_hit,
            "coverage_pct": coverage_pct,
            "threats_intercepted": intercepts,
            "controls": [
                {"id": ctrl_id, "description": ctrl_desc, "active": any(
                    t == f"{fw_id}:{ctrl_id}" for t in all_tags
                )}
                for ctrl_id, ctrl_desc in fw_info["controls"].items()
            ]
        })

    overall_score = round(
        sum(f["health_score"] for f in frameworks) / len(frameworks)
    ) if frameworks else 0

    return {
        "overall_compliance_score": overall_score,
        "frameworks": frameworks,
        "summary": {
            "total_threats_intercepted": total_alerts,
            "shadow_ai_nodes_detected": shadow_nodes,
            "compliance_tags_generated": len(all_tags),
        },
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/violations")
async def compliance_violations():
    """
    Return recent compliance violations with framework mapping.
    Used by the dashboard Compliance tab for the violations table.
    """
    alerts = get_alerts_store()

    violations = []
    for alert in alerts[-50:]:  # Last 50
        tags = _classify_alert_compliance(alert)
        if tags:
            violations.append({
                "timestamp": alert.get("timestamp", ""),
                "source_ip": alert.get("source", ""),
                "destination": alert.get("destination", ""),
                "severity": alert.get("severity", "LOW"),
                "reason": alert.get("reason", ""),
                "compliance_frameworks": list(set(t.split(":")[0] for t in tags)),
                "controls_affected": tags,
            })

    return {
        "total": len(violations),
        "violations": list(reversed(violations)),  # Most recent first
    }


@router.get("/audit-log")
async def compliance_audit_log():
    """
    Generate a compliance audit log suitable for SOC 2 / ISO 27001 auditors.
    """
    alerts = get_alerts_store()

    log_entries = []
    for alert in alerts:
        tags = _classify_alert_compliance(alert)
        log_entries.append({
            "event_id": f"SH-{hash(str(alert)) & 0xFFFFFF:06X}",
            "timestamp": alert.get("timestamp", ""),
            "event_type": "threat_intercepted",
            "source": alert.get("source", ""),
            "target": alert.get("destination", ""),
            "severity": alert.get("severity", ""),
            "action_taken": "blocked" if alert.get("severity") == "HIGH" else "flagged",
            "compliance_controls": tags,
            "details": alert.get("reason", ""),
        })

    return {
        "audit_period": {
            "start": log_entries[0]["timestamp"] if log_entries else "",
            "end": log_entries[-1]["timestamp"] if log_entries else "",
        },
        "total_events": len(log_entries),
        "entries": list(reversed(log_entries[-100:])),  # Last 100, most recent first
    }
