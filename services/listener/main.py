import asyncio
import os
import signal
from contextlib import asynccontextmanager
from loguru import logger
from scapy.all import AsyncSniffer

from pkg.models.events import NetworkFlowEvent
from services.listener.sniffer import PacketProcessor

# Configuration
SH_ENV = os.getenv("SH_ENV", "local").lower()
KAFKA_BOOTSTRAP = os.getenv("SH_KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC = os.getenv("SH_KAFKA_TOPIC", "sh.telemetry.traffic.v1")
INTERFACE = os.getenv("SH_CAPTURE_INTERFACE", None) 

class ListenerService:
    def __init__(self, broker=None):
        # Dependency Injection based on Environment
        if broker:
            self.broker = broker
        elif SH_ENV == "production":
            from pkg.infra.enterprise.broker import KafkaBroker
            self.broker = KafkaBroker(KAFKA_BOOTSTRAP)
        else:
            from pkg.infra.local.broker import MemoryBroker
            self.broker = MemoryBroker() 
            
        self.processor = PacketProcessor(self.broker)
        self.sniffer = None

    async def start(self):
        logger.info(f"Starting Listener Service in {SH_ENV.upper()} mode...")
        await self.broker.start()
        
        logger.info(f"Starting packet capture on interface: {INTERFACE or 'ALL'}")
        self.sniffer = AsyncSniffer(
            iface=INTERFACE,
            prn=self.processor.process_packet_callback,
            store=False
        )
        self.sniffer.start()
        logger.info("Packet capture started.")

    async def stop(self):
        logger.info("Stopping Listener Service...")
        if self.sniffer:
            self.sniffer.stop()
        await self.broker.stop()
        logger.info("Service stopped.")
