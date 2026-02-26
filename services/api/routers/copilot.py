import asyncio
import os
import time
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
from google import genai
from services.api.routers.policy import _alerts_store

router = APIRouter()

# Simple in-memory rate limiting dictionary
# Format: { ip_address: [timestamp1, timestamp2, ...] }
_rate_limits: Dict[str, list] = {}

class CopilotRequest(BaseModel):
    alert_id: str

def build_analysis_prompt(alert: Dict[str, Any]) -> str:
    """
    Builds the prompt to send to the Gemini model for analysis.
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
        dlp_section = "Data Exfiltration Evidence:\n"
        for i, snippet in enumerate(dlp_snippets):
            dlp_section += f"- Match {i+1} ({snippet.get('rule')}): {snippet.get('snippet')}\n"

    # Extract active defense context
    probe_section = ""
    if "active_probe" in alert:
        probe = alert["active_probe"]
        status = "CONFIRMED AI" if probe.get("confirmed_ai") else "INCONCLUSIVE"
        probe_section = f"Active Defense Interrogation (Result: {status})\n"
        probe_section += f"- Target: {target}\n"
        probe_section += f"- Finding: Server responded with known LLM API headers.\n\n"

    prompt = f"""You are 'Hunter AI', an elite cybersecurity analyst AI built into the Shadow Hunter Active Defense platform.
Your job is to provide a highly realistic, professional, incident investigation report based on the provided telemetry.
Use Markdown formatting. Be concise but highly technical.

Incident Details:
- Incident ID: {alert.get('id')}
- Timestamp: {alert.get('timestamp')}
- Severity: {severity}
- Source Node: {node} (Identity: {identity})
- Destination Target: {target} ({alert.get('destination_ip', 'Unknown IP')})
- Protocol: {alert.get('protocol', 'TCP')} on Port {alert.get('destination_port', '443')}
- Data Transferred: OUT: {alert.get('bytes_sent', 0)} bytes / IN: {alert.get('bytes_received', 0)} bytes.
- Rule Triggered: {rule}

{dlp_section}
{probe_section}
MITRE ATT&CK Mapping (if known):
- Tactic: {alert.get('mitre', {}).get('tactic', 'Unknown')}
- Technique: {alert.get('mitre', {}).get('technique_name', 'Unknown')} ({alert.get('mitre', {}).get('technique_id', 'Unknown')})

Write the report with the following sections:
1.  **🔍 Executive Summary**: A 2-sentence summary of what happened and why it's a risk (e.g., unauthorized shadow AI usage, exfiltration).
2.  **📊 Telemetry Analysis**: A brief technical breakdown of the connection and data transfer. Mention the DLP or probe results if provided.
3.  **🧠 Attacker Motivation Phase (MITRE ATT&CK)**: What the actor is attempting to achieve based on the mapping.
4.  **🛡️ Recommended Playbook**: Recommended next steps for the SOC (e.g. Quarantine, Identity Review).

Do not include a greeting or preamble. Output the markdown report directly. Start with an `# 🤖 Hunter AI: Incident Investigation Report` header."""
    return prompt

def generate_mock_analysis(alert: Dict[str, Any]) -> str:
    """Fallback if no API key is set."""
    node = alert.get("source", "Unknown Node")
    target = alert.get("target", "Unknown Target")
    rule = alert.get("matched_rule", "Anomalous Behavior")
    severity = alert.get("severity", "MEDIUM")
    
    identity = "Unauthenticated Device"
    if "user" in alert.get("metadata", {}):
        identity = f"{alert['metadata']['user'].get('name', 'Unknown User')} ({alert['metadata']['user'].get('department', 'Unknown Dept')})"
    
    template = f"""# 🤖 Hunter AI: Incident Investigation Report

**Incident ID:** `{alert.get('id')}`
**Timestamp:** `{alert.get('timestamp')}`
**Severity:** `{severity}`

---

### 🔍 Executive Summary
A high-confidence security anomaly was detected originating from **{node}** (Identity: *{identity}*). The node engaged in **{rule}** communicating with external endpoint **{target}**. This is a fallback mock report; configure a Gemini API key for dynamic analysis.

### 🛡️ Recommended Playbook
1. **Quarantine:** Immediately isolate `{node}` from the corporate VLAN.
2. **Setup:** Add a `GEMINI_API_KEY` environment variable.
"""
    return template

async def generate_gemini_analysis(prompt: str) -> str:
    """Calls Gemini to generate the analysis."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return ""
        
    try:
        # Run synchronous SDK call in thread to avoid blocking asyncio
        # In a real async app we'd use the async client if available or thread pool
        client = genai.Client(api_key=api_key)
        response = await asyncio.to_thread(
            client.models.generate_content,
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"Error connecting to Gemini: {str(e)}"

async def stream_analysis(text: str):
    """Simulates an LLM token-by-token stream for UI realism."""
    tokens = text.split(" ")
    for token in tokens:
        yield token + " "
        await asyncio.sleep(0.02)

@router.post("/analyze")
async def analyze_alert(req: CopilotRequest, request: Request):
    """
    Streams a mock LLM analysis of the requested alert.
    Uses Server-Sent Events (SSE) / Streaming response.
    """
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # 5 requests per minute per IP
    if client_ip in _rate_limits:
        timestamps = _rate_limits[client_ip]
        # Clean up old timestamps (older than 60s)
        timestamps = [ts for ts in timestamps if now - ts < 60]
        if len(timestamps) >= 5:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")
        timestamps.append(now)
        _rate_limits[client_ip] = timestamps
    else:
        _rate_limits[client_ip] = [now]

    alert = next((a for a in _alerts_store if a["id"] == req.alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found in in-memory store.")
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        prompt = build_analysis_prompt(alert)
        analysis_text = await generate_gemini_analysis(prompt)
        if not analysis_text:  # Fallback on err
             analysis_text = generate_mock_analysis(alert)
    else:
        analysis_text = generate_mock_analysis(alert)
        
    return StreamingResponse(stream_analysis(analysis_text), media_type="text/plain")
