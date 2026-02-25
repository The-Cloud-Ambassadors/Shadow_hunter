import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
from services.api.routers.policy import _alerts_store

router = APIRouter()

class CopilotRequest(BaseModel):
    alert_id: str

def generate_mock_analysis(alert: Dict[str, Any]) -> str:
    """
    Deterministically generates a highly realistic, markdown-formatted
    LLM analysis based on the alert's specific telemetry context.
    """
    node = alert.get("source", "Unknown Node")
    target = alert.get("target", "Unknown Target")
    rule = alert.get("matched_rule", "Anomalous Behavior")
    severity = alert.get("severity", "MEDIUM")
    
    # Extract identity if available in the alert metadata
    identity = "Unauthenticated Device"
    if "user" in alert.get("metadata", {}):
        identity = f"{alert['metadata']['user'].get('name', 'Unknown User')} ({alert['metadata']['user'].get('department', 'Unknown Dept')})"
    
    # Extract DLP evidence if available
    dlp_snippets = alert.get("dlp_snippets", [])
    dlp_section = ""
    if dlp_snippets:
        dlp_section = "### 🚨 Data Exfiltration Evidence\n"
        for i, snippet in enumerate(dlp_snippets):
            dlp_section += f"**Match {i+1} ({snippet.get('rule')}):** `{snippet.get('snippet')}`\n\n"

    # Extract active defense context
    probe_section = ""
    if "active_probe" in alert:
        probe = alert["active_probe"]
        status = "CONFIRMED AI" if probe.get("confirmed_ai") else "INCONCLUSIVE"
        probe_section = f"### 🛡️ Active Defense Interrogation (Result: {status})\n"
        probe_section += f"- **Target:** `{target}`\n"
        probe_section += f"- **Probe Method:** Application-layer TLS probing\n"
        probe_section += f"- **Finding:** Server responded with known LLM API headers.\n\n"

    template = f"""# 🤖 Hunter AI: Incident Investigation Report

**Incident ID:** `{alert.get('id')}`
**Timestamp:** `{alert.get('timestamp')}`
**Severity:** `{severity}`

---

### 🔍 Executive Summary
A high-confidence security anomaly was detected originating from **{node}** (Identity: *{identity}*). The node engaged in **{rule}** communicating with external endpoint **{target}**. Based on telemetry and graph heuristics, this pattern is consistent with unauthorized evasion or exfiltration techniques.

### 📊 Telemetry Analysis
- **Source Node:** `{node}`
- **Destination:** `{target}` ({alert.get('destination_ip', 'Unknown IP')})
- **Protocol:** `{alert.get('protocol', 'TCP')}` on Port `{alert.get('destination_port', '443')}`
- **Data Transferred:** `{alert.get('bytes_sent', 0)}` bytes OUT / `{alert.get('bytes_received', 0)}` bytes IN.

{dlp_section}
{probe_section}
### 🧠 Attacker Motivation Phase (MITRE ATT&CK)
The ML telemetry maps this behavior to the following MITRE ATT&CK categories:
- **Tactic:** {alert.get('mitre', {}).get('tactic', 'Unknown')}
- **Technique:** {alert.get('mitre', {}).get('technique_name', 'Unknown')} ({alert.get('mitre', {}).get('technique_id', 'Unknown')})

### 🛡️ Recommended Playbook
1. **Quarantine:** Immediately isolate `{node}` from the corporate VLAN using the zero-trust response engine.
2. **Identity Review:** Suspend the IdP session for *{identity}* pending SOC review.
3. **Forensics:** Pull PCAP logs via the Shadow Hunter listener for port `{alert.get('destination_port', '443')}` targeting {target}.
"""
    return template

async def stream_analysis(text: str):
    """Simulates an LLM token-by-token stream for UI realism."""
    # Split text roughly into words/tokens
    tokens = text.split(" ")
    for token in tokens:
        yield token + " "
        # Artificial typing delay
        await asyncio.sleep(0.03)

@router.post("/analyze")
async def analyze_alert(req: CopilotRequest):
    """
    Streams a mock LLM analysis of the requested alert.
    Uses Server-Sent Events (SSE) / Streaming response.
    """
    alert = next((a for a in _alerts_store if a["id"] == req.alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found in in-memory store.")
        
    analysis_text = generate_mock_analysis(alert)
    return StreamingResponse(stream_analysis(analysis_text), media_type="text/plain")
