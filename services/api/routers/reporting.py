from fastapi import APIRouter, Response
from services.reporting.pdf_generator import generate_incident_report
from services.api.routers import policy # to access alerts in memory

router = APIRouter(tags=["Reporting"])

@router.get("/pdf")
async def download_pdf_report():
    """
    Generate and download a PDF incident report.
    """
    # Get alerts from memory
    alerts = policy.ALERTS_DB
    risk_score = 85.5 # Mock for now or calculate real average
    
    pdf_buffer = generate_incident_report(alerts, risk_score)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=shadow_hunter_report.pdf"}
    )
