from typing import List, Dict, Any, Optional
from loguru import logger
import re

class SoarPlaybook:
    def __init__(self, id: str, name: str, condition: Dict[str, Any], action: str, enabled: bool = True):
        self.id = id
        self.name = name
        self.condition = condition  # e.g., {"severity": "CRITICAL", "type": "dlp"}
        self.action = action        # e.g., "quarantine"
        self.enabled = enabled

    def matches(self, alert: Dict[str, Any]) -> bool:
        if not self.enabled:
            return False
            
        # Check all condition keys against the alert
        for key, expected_val in self.condition.items():
            if key not in alert:
                return False
                
            actual_val = alert[key]
            
            # Sub-match for lists or complex dicts
            if isinstance(expected_val, list):
                if actual_val not in expected_val:
                    return False
            elif isinstance(expected_val, str) and "*" in expected_val:
                # Simple wildcard regex
                pattern = expected_val.replace("*", ".*")
                if not re.match(pattern, str(actual_val), re.IGNORECASE):
                    return False
            else:
                if actual_val != expected_val:
                    return False
                    
        return True

class SoarEngine:
    """Security Orchestration, Automation, and Response Engine"""
    def __init__(self):
        self.playbooks: List[SoarPlaybook] = [
            # Playbook 1: Instant quarantine for ANY Critical threat (like DLP violation)
            SoarPlaybook(
                id="soar-pb-001",
                name="Auto-Quarantine Critical Threats",
                condition={"severity": "CRITICAL"},
                action="quarantine",
                enabled=True
            ),
            # Playbook 2: Quarantine for high-severity Shadow AI
            SoarPlaybook(
                id="soar-pb-002",
                name="Block Active Shadow AI Anomalies",
                condition={"severity": "HIGH", "ml_classification": "shadow_ai"},
                action="quarantine",
                enabled=True
            )
        ]

    def evaluate(self, alert: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """
        Evaluate an alert against all playbooks.
        Returns the action taken, if any.
        """
        taken_actions = []
        for playbook in self.playbooks:
            if playbook.matches(alert):
                logger.warning(f"⚡ SOAR Engine executing playbook [{playbook.name}] -> Action: {playbook.action}")
                
                # Execute mapped action
                if playbook.action == "quarantine":
                    success = self._execute_quarantine(alert.get("source"))
                    if success:
                        taken_actions.append({"playbook": playbook.name, "action": playbook.action, "target": alert.get("source")})
        
        return taken_actions if taken_actions else None

    def _execute_quarantine(self, ip: str) -> bool:
        """Calls the internal defense module directly."""
        try:
            if not ip:
                return False
            from services.api.routers.defense import _quarantined_nodes, _quarantine_lock
            from datetime import datetime
            
            with _quarantine_lock:
                _quarantined_nodes[ip] = {
                    "ip": ip,
                    "reason": "SOAR Auto-Quarantine Playbook Activated",
                    "threat_score": 1.0,
                    "quarantined_at": datetime.utcnow().isoformat(),
                    "auto_triggered": True,
                    "status": "active",
                    "released_at": None,
                }
            logger.info(f"⚡ SOAR ACTION: Quarantined node {ip}")
            return True
        except Exception as e:
            logger.error(f"SOAR quarantine failed: {e}")
            return False

# Global singleton
soar_engine = SoarEngine()
