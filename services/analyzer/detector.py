from pkg.models.events import NetworkFlowEvent, Protocol
from pkg.data.ai_domains import is_ai_domain

class AnomalyDetector:
    """
    Detects Shadow AI and Anomalous behaviors.
    """
    def __init__(self):
        self.known_subnets = ["192.168.", "10.0.", "172.16.", "127.0."]
        self.known_ports = [80, 443, 8080, 53]

    def is_internal(self, ip: str) -> bool:
        return any(ip.startswith(prefix) for prefix in self.known_subnets)

    def detect(self, event: NetworkFlowEvent) -> (bool, str):
        """
        Returns (is_anomalous, reason)
        """
        # 1. Metadata Analysis (DPI)
        host = event.metadata.get("host") or event.metadata.get("sni") or event.metadata.get("dns_query")
        
        if host:
            if is_ai_domain(host):
                return True, f"Known AI Service Accessed: {host}"
            
            # If it's a domain we don't know, and it's definitely not internal
            if not self.is_internal(host) and not host.endswith(".local") and "." in host:
                 # Shadow Service heuristic
                 pass 

        # 2. Rule: Unknown outbound traffic on non-standard ports
        if self.is_internal(event.source_ip) and not self.is_internal(event.destination_ip):
            if event.destination_port not in self.known_ports:
                return True, f"Outbound traffic to {event.destination_ip} on unusual port {event.destination_port}"

        # 3. Rule: DNS tunneling suspect (High payload size on DNS)
        if event.protocol == Protocol.DNS and event.bytes_sent > 500:
             return True, "Potential DNS Tunneling (Large DNS Payload)"

        return False, None
