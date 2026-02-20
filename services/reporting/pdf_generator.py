from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import io
from datetime import datetime

def generate_incident_report(alerts: list, risk_score: float):
    """
    Generate a PDF report for the security analyst in memory.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, "Shadow Hunter Incident Report")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    c.drawString(50, height - 100, f"Overall Network Risk Score: {risk_score:.2f} / 100")
    
    # Draw Line
    c.line(50, height - 110, width - 50, height - 110)
    
    # Executive Summary
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 140, "Executive Summary")
    c.setFont("Helvetica", 10)
    summary_text = (
        f"The Shadow Hunter Active Defense System has detected {len(alerts)} disparate security events. "
        "Primary threats include potential Shadow AI usage and unauthorized data exfiltration. "
        "Immediate remediation of high-risk nodes is recommended."
    )
    # Simple text wrapping simulation
    c.drawString(50, height - 160, summary_text[:90])
    c.drawString(50, height - 175, summary_text[90:])
    
    # Critical Alerts Table
    y = height - 220
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Top Critical Alerts")
    y -= 20
    
    # Headers
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, y, "Time")
    c.drawString(200, y, "Source")
    c.drawString(350, y, "Target")
    c.drawString(500, y, "Severity")
    y -= 15
    c.line(50, y+12, width-50, y+12)
    
    # Rows
    c.setFont("Helvetica", 9)
    for alert in alerts[:15]: # Limit to 15 to fit one page for demo
        if y < 50: break
        timestamp = alert.get("timestamp", "")[:19].replace("T", " ")
        src = alert.get("source", "N/A")
        tgt = alert.get("target", "N/A")
        sev = alert.get("severity", "LOW")
        
        if sev == "CRITICAL": c.setFillColor(colors.red)
        elif sev == "HIGH": c.setFillColor(colors.orange)
        else: c.setFillColor(colors.black)
        
        c.drawString(50, y, timestamp)
        c.drawString(200, y, src)
        c.drawString(350, y, tgt)
        c.drawString(500, y, sev)
        
        c.setFillColor(colors.black)
        y -= 15

    c.save()
    buffer.seek(0)
    return buffer
