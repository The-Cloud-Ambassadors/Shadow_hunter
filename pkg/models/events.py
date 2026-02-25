from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, Field
from enum import Enum

class Protocol(str, Enum):
    TCP = "TCP"
    UDP = "UDP"
    HTTP = "HTTP"
    HTTPS = "HTTPS"
    GRPC = "GRPC"
    DNS = "DNS"

class NetworkFlowEvent(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source_ip: str
    source_port: int
    destination_ip: str
    destination_port: int
    protocol: Protocol
    bytes_sent: int = 0
    bytes_received: int = 0
    duration_ms: float = 0.0
    payload_sample: Optional[str] = None # Base64 encoded or truncated text
    metadata: Dict[str, str] = Field(default_factory=dict)

    # ── Identity Provider (IdP) enrichment fields ──
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    department: Optional[str] = None

    # ── Quarantine / Kill-Switch status ──
    quarantine_status: Optional[str] = None  # None | "active" | "released"

    # ── DLP (Data Loss Prevention) ──
    dlp_violation: bool = False
    dlp_snippets: List[Dict[str, str]] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
