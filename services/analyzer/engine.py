import asyncio
from typing import Dict, Any
from loguru import logger
from pkg.core.interfaces import EventBroker, GraphStore
from pkg.models.events import NetworkFlowEvent
from services.analyzer.detector import AnomalyDetector

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

            # 2. Update Graph
            # Nodes
            src_id = event.source_ip
            dst_id = event.destination_ip
            
            await self.graph.add_node(src_id, ["IP"], {"last_seen": event.timestamp.isoformat()})
            await self.graph.add_node(dst_id, ["IP"], {"last_seen": event.timestamp.isoformat()})

            # Edge
            relation = "TALKS_TO"
            props = {
                "protocol": event.protocol,
                "dst_port": event.destination_port,
                "last_seen": event.timestamp.isoformat()
            }
            await self.graph.add_edge(src_id, dst_id, relation, props)

            # 3. Detect Anomalies
            is_anomalous, reason = self.detector.detect(event)
            if is_anomalous:
                logger.warning(f"Anomaly Detected: {src_id} -> {dst_id} ({reason})")
                
                # Publish Alert
                alert = {
                    "id": f"alert-{event.timestamp.timestamp()}",
                    "severity": "HIGH",
                    "description": reason,
                    "source": src_id,
                    "target": dst_id,
                    "timestamp": event.timestamp.isoformat()
                }
                # We need an Alert model, but dict is fine for now
                # await self.broker.publish("sh.alerts.v1", alert)

        except Exception as e:
            logger.error(f"Error handling event: {e}")
