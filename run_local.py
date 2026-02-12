import asyncio
import uvicorn
import os
from loguru import logger
from contextlib import asynccontextmanager

from pkg.infra.local.broker import MemoryBroker
from pkg.infra.local.store import NetworkXStore
from services.analyzer.engine import AnalyzerEngine
from services.listener.main import ListenerService
from services.api.main import app as api_app
from services.api.dependencies import set_graph_store

async def main():
    logger.info("Starting Shadow Hunter in MONOLITH LOCAL mode...")
    
    # 1. Initialize Shared Infrastructure (The "Bus")
    broker = MemoryBroker()
    store = NetworkXStore()
    
    # 2. Start Infrastructure
    await broker.start()
    
    # 3. Initialize Shared State for API
    set_graph_store(store)
    
    # 4. Initialize Services (The "Microservices")
    analyzer = AnalyzerEngine(broker, store)
    listener = ListenerService(broker=broker)
    
    # 5. Start Services
    await analyzer.start()
    await listener.start()

    # 6. Simulator (Optional)
    import sys
    if "--simulate" in sys.argv:
        from simulate_traffic import simulator
        # We need to adapt simulator to use our existing broker instance
        logger.info("Starting Traffic Simulator...")
        
        async def run_sim():
            internal_services = ["192.168.1.10", "192.168.1.11", "192.168.1.12"]
            external_apis = ["api.openai.com", "huggingface.co", "github.com"]
            shadow_apis = ["104.21.55.2", "45.33.22.11"] 
            
            from pkg.models.events import NetworkFlowEvent, Protocol
            import random
            
            while True:
                # Normal Traffic
                src = random.choice(internal_services)
                dst = random.choice(internal_services)
                await broker.publish("sh.telemetry.traffic.v1", NetworkFlowEvent(
                    source_ip=src, source_port=1234, destination_ip=dst, destination_port=80, protocol=Protocol.HTTP
                ))

                # External Traffic
                if random.random() > 0.6:
                    src = random.choice(internal_services)
                    dst = random.choice(external_apis)
                    await broker.publish("sh.telemetry.traffic.v1", NetworkFlowEvent(
                        source_ip=src, source_port=1234, destination_ip=dst, destination_port=443, protocol=Protocol.HTTPS
                    ))

                # Shadow/Anomaly Traffic
                if random.random() > 0.9:
                    src = random.choice(internal_services)
                    dst = random.choice(shadow_apis)
                    await broker.publish("sh.telemetry.traffic.v1", NetworkFlowEvent(
                        source_ip=src, source_port=1234, destination_ip=dst, destination_port=6667, protocol=Protocol.TCP
                    ))

                await asyncio.sleep(2)

        asyncio.create_task(run_sim())
    
    # 7. Start API (in same loop using uvicorn config)
    config = uvicorn.Config(api_app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    
    logger.info("All services started. Press Ctrl+C to stop.")
    
    try:
        await server.serve()
    except asyncio.CancelledError:
        pass
    finally:
        logger.info("Shutting down...")
        await listener.stop()
        # analyzer doesn't have stop yet, but broker stop handles it
        await broker.stop()

if __name__ == "__main__":
    try:
        # Check for admin privileges (needed for simple raw socket sniffing on some OS)
        # On Windows, Npcap driver handles this usually?
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
