from typing import Dict, Any, List
from datetime import datetime
import json
import os
import time

class AuditLogStore:
    """
    Immutable ledger of system administrative and active defense actions.
    Crucial for SOC 2, ISO 27001, and general forensic traceability.
    """
    
    def __init__(self):
        self._logs: List[Dict[str, Any]] = []
        # In a real system, this would write to an append-only WORM drive, 
        # S3 with object lock, or a blockchain-backed ledger.
        self._storage_path = os.path.join(os.path.dirname(__file__), "..", "..", "logs", "audit_ledger.jsonl")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(self._storage_path), exist_ok=True)
        
        # Load existing
        self._load()

    def _load(self):
        if os.path.exists(self._storage_path):
            with open(self._storage_path, "r") as f:
                for line in f:
                    if line.strip():
                        try:
                            self._logs.append(json.loads(line))
                        except Exception:
                            pass
        self._logs.sort(key=lambda x: x["timestamp"], reverse=True)

    def append(self, actor: str, action: str, resource: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Appends an immutable event to the audit ledger.
        """
        entry = {
            "id": f"evt-{int(time.time()*1000)}",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "actor": actor,          # User, System, or Service Account (e.g., 'Analyst J.Doe', 'SOAR Engine')
            "action": action.upper(),# e.g., 'QUARANTINE_NODE', 'CREATE_RULE', 'TOGGLE_RULE'
            "resource": resource,    # e.g., '10.0.0.5', 'Rule-123'
            "details": details       # e.g., {"reason": "Manual isolation", "severity": "CRITICAL"}
        }
        
        self._logs.insert(0, entry) # Keep in-memory sorted newest first
        
        # Append to persistent ledger
        try:
            with open(self._storage_path, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            # Important: Failure to audit should ideally halt the action in a strict system
            import logging
            logging.error(f"Failed to write to immutable audit ledger: {e}")
            
        # Broadcast the audit to UI if possible
        try:
            import asyncio
            from services.api.transceiver import manager
            # We don't await because this might be called from sync context. 
            # In a mixed sync/async app, we'd need to handle this carefully.
            # For now, UI will just poll or reload.
        except Exception:
            pass
            
        return entry

    def get_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self._logs[:limit]

# Global singleton
audit_store = AuditLogStore()
