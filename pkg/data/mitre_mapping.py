from typing import Dict, List, Optional
from loguru import logger

class MitreMapper:
    """
    Maps Shadow Hunter semantic alerts into the MITRE ATT&CK Framework.
    """
    
    # Static Mapping dictionary mapping semantic keywords/rules to MITRE Tactics and Techniques
    _MAPPING = {
        # Exfiltration
        "dlp violation": {
            "tactic": "Exfiltration",
            "technique_id": "T1048",
            "technique_name": "Exfiltration Over Alternative Protocol"
        },
        "shadow ai": {
            "tactic": "Exfiltration",
            "technique_id": "T1567",
            "technique_name": "Exfiltration Over Web Service"
        },
        "significant data volume transferred": {
            "tactic": "Exfiltration",
            "technique_id": "T1041",
            "technique_name": "Exfiltration Over C2 Channel"
        },
        
        # Discovery
        "graph centrality analysis": {
            "tactic": "Discovery",
            "technique_id": "T1046",
            "technique_name": "Network Service Discovery"
        },
        
        # Lateral Movement
        "lateral movement": {
            "tactic": "Lateral Movement",
            "technique_id": "T1021",
            "technique_name": "Remote Services"
        },
        
        # Command and Control
        "beaconing behavior": {
            "tactic": "Command and Control",
            "technique_id": "T1071",
            "technique_name": "Application Layer Protocol"
        },
        "suspicious traffic": {
            "tactic": "Command and Control",
            "technique_id": "T1568",
            "technique_name": "Dynamic Resolution"
        },

        # Credential Access
        "brute force": {
            "tactic": "Credential Access",
            "technique_id": "T1110",
            "technique_name": "Brute Force"
        },
        "spoofing": {
             "tactic": "Credential Access",
             "technique_id": "T1556",
             "technique_name": "Modify Authentication Process"
        }
    }

    @classmethod
    def map_alert(cls, rule_name: str, description: str) -> Optional[Dict[str, str]]:
        """
        Attempts to map an alert to a MITRE tactic and technique based on
        its rule name or description.
        """
        search_text = f"{rule_name} {description}".lower()
        
        for keyword, mapping in cls._MAPPING.items():
            if keyword in search_text:
                return mapping
                
        # Default fallback for anomalous but unmapped behavior
        if "anomaly" in search_text or "anomalous" in search_text:
            return {
                "tactic": "Command and Control",
                "technique_id": "T1071",
                "technique_name": "Application Layer Protocol"
            }
            
        return None

mitre_mapper = MitreMapper()
