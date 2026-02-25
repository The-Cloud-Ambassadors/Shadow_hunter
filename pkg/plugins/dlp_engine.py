import re
from typing import Dict, List, Optional
from pydantic import BaseModel
from loguru import logger

class DlpMatch(BaseModel):
    rule_name: str
    severity: str
    redacted_snippet: str

class DlpEngine:
    """
    Scans packet payloads for sensitive data (PII, Credentials, Secrets).
    Uses regex patterns to identify violations and returns redacted snippets.
    """
    def __init__(self):
        # High-confidence regex patterns for enterprise secrets
        self.rules = {
            "AWS Access Key": {
                "pattern": re.compile(r"(?i)(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"),
                "severity": "CRITICAL"
            },
            "RSA Private Key": {
                "pattern": re.compile(r"-----BEGIN RSA PRIVATE KEY-----"),
                "severity": "CRITICAL"
            },
            "Credit Card Number": {
                # Basic check for 13-19 digit numbers, often separated by spaces or dashes
                "pattern": re.compile(r"\b(?:\d[ -]*?){13,16}\b"),
                "severity": "HIGH",
                "validate": self._validate_luhn
            },
            "Social Security Number": {
                "pattern": re.compile(r"\b(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}\b"),
                "severity": "HIGH"
            }
        }

    def _validate_luhn(self, cc_str: str) -> bool:
        """Simple Luhn validation to reduce false positives on CC numbers."""
        digits = [int(c) for c in cc_str if c.isdigit()]
        if len(digits) < 13 or len(digits) > 19:
            return False
        checksum = 0
        is_even = False
        for digit in reversed(digits):
            if is_even:
                digit *= 2
                if digit > 9:
                    digit -= 9
            checksum += digit
            is_even = not is_even
        return checksum % 10 == 0

    def scan_payload(self, payload: str) -> List[DlpMatch]:
        """Scans a text payload and returns a list of DLP violations found."""
        matches: List[DlpMatch] = []
        if not payload:
            return matches

        for rule_name, rule_config in self.rules.items():
            for match in rule_config["pattern"].finditer(payload):
                raw_match = match.group(0)
                
                # Check secondary validation if present (e.g., Luhn for CCs)
                if "validate" in rule_config and not rule_config["validate"](raw_match):
                    continue

                # Redact the match (keep first/last few chars, mask the rest)
                redacted = self._redact(raw_match, rule_name)
                
                # Extract a snippet around the match for context
                start = max(0, match.start() - 20)
                end = min(len(payload), match.end() + 20)
                snippet = payload[start:end]
                redacted_snippet = snippet.replace(raw_match, redacted)

                matches.append(DlpMatch(
                    rule_name=rule_name,
                    severity=rule_config["severity"],
                    redacted_snippet=redacted_snippet
                ))
                
        return matches

    def _redact(self, raw: str, rule_name: str) -> str:
        """Redacts sensitive strings to prevent storing them in the DB/logs."""
        if len(raw) <= 4:
            return "****"
            
        if rule_name == "Credit Card Number":
            return f"XXXX-XXXX-XXXX-{raw[-4:]}"
        elif rule_name == "AWS Access Key":
            return f"{raw[:4]}...{raw[-4:]}"
        elif rule_name == "Social Security Number":
            return "XXX-XX-" + raw[-4:]
        else:
            return f"**REDACTED: {rule_name}**"

# Global singleton
dlp_engine = DlpEngine()
