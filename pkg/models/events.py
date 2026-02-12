from datetime import datetime
from typing import Optional, Dict
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
    payload_sample: Optional[str] = None # Base64 encoded or truncated text
    metadata: Dict[str, str] = Field(default_factory=dict)

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
