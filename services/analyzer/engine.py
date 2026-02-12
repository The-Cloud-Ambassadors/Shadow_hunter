import asyncio
from typing import Dict, Any
from loguru import logger
from pkg.core.interfaces import EventBroker, GraphStore
from pkg.models.events import NetworkFlowEvent
from services.analyzer.detector import AnomalyDetector
from pkg.data.ai_domains import is_ai_domain

class AnalyzerEngine:
    """
    The "Brain" of Shadow Hunter.
    Decoupled from infrastructure via EventBroker and GraphStore interfaces.
    """
    def __init__(self, broker: EventBroker, graph_store: GraphStore):
        self.broker = broker
        self.graph = graph_store
        self.detector = AnomalyDetector()

    async def start(self):
        logger.info("Analyzer Engine starting...")
        # Subscribe to traffic events
        await self.broker.subscribe("sh.telemetry.traffic.v1", self.handle_traffic_event)
        logger.info("Subscribed to traffic events.")

    async def handle_traffic_event(self, event_data:  Any):
        try:
            # 1. Parse Event
            if isinstance(event_data, dict):
                event = NetworkFlowEvent(**event_data)
            elif isinstance(event_data, NetworkFlowEvent):
                event = event_data
            else:
                logger.error(f"Unknown event data type: {type(event_data)}")
                return

            # 2. Enrich & Classify Nodes
            # Determine Hostname from DPI metadata if available
            host = event.metadata.get("host") or event.metadata.get("sni") or event.metadata.get("dns_query")
            
            # --- Source Classification ---
            src_id = event.source_ip
            src_type = "internal" if self.detector.is_internal(src_id) else "external"
            src_props = {
                "label": src_id,
                "type": src_type,
                "last_seen": event.timestamp.isoformat()
            }

            # --- Destination Classification ---
            # Default to IP
            dst_id = event.destination_ip
            dst_label = dst_id
            dst_type = "external" 

            if self.detector.is_internal(dst_id):
                dst_type = "internal"
            
            # Override with Hostname if available (DPI)
            if host:
                dst_id = host # Use domain as ID for graph clarity
                dst_label = host
                # Check if it's a Shadow AI service
                if is_ai_domain(host):
                    dst_type = "shadow"
                elif not self.detector.is_internal(dst_id):
                     dst_type = "external"

            dst_props = {
                "label": dst_label,
                "type": dst_type,
                "last_seen": event.timestamp.isoformat()
            }

            # 3. Update Graph
            await self.graph.add_node(src_id, ["Node"], src_props)
            await self.graph.add_node(dst_id, ["Node"], dst_props)

            # Edge
            relation = "TALKS_TO"
            edge_props = {
                "protocol": event.protocol,
                "dst_port": event.destination_port,
                "byte_count": event.bytes_sent + event.bytes_received,
                "last_seen": event.timestamp.isoformat()
            }
            await self.graph.add_edge(src_id, dst_id, relation, edge_props)

            # 4. Detect Anomalies & Alert
            is_anomalous, reason = self.detector.detect(event)
            if is_anomalous:
                logger.warning(f"Anomaly Detected: {src_id} -> {dst_id} ({reason})")
                
                # Publish Alert
                alert = {
                    "id": f"alert-{event.timestamp.timestamp()}",
                    "severity": "HIGH",
                    "description": reason,
                    "source": src_id,
                    "target": dst_label, # Use readable label
                    "timestamp": event.timestamp.isoformat()
                }
                # Publish to alerts topic
                await self.broker.publish("sh.alerts.v1", alert)

        except Exception as e:
            logger.error(f"Error handling event: {e}")
