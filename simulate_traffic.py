import asyncio
import random
import os
from datetime import datetime
from loguru import logger
from pkg.models.events import NetworkFlowEvent, Protocol

# Configuration
SH_ENV = os.getenv("SH_ENV", "local").lower()

async def simulator():
    logger.info(f"Starting Traffic Simulator in {SH_ENV.upper()} mode...")

    # dependency injection (same as listener)
    if SH_ENV == "production":
        from pkg.infra.enterprise.broker import KafkaBroker
        KAFKA_BOOTSTRAP = os.getenv("SH_KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
        broker = KafkaBroker(KAFKA_BOOTSTRAP)
    else:
        # In local mode, we can't easily inject into the running monolith process from a separate script
        # unless we use a persistent queue or shared memory.
        # However, for 'simulation', we usually want to feed the *running* analyzer.
        # If we use MemoryBroker in a separate process, it won't work.
        
        logger.warning("IN LOCAL MONOLITH MODE, SIMULATOR MUST BE PART OF THE RUNNER.")
        logger.warning("Please use the --simulate flag on run_local.py instead.")
        return

    await broker.start()

    internal_services = ["192.168.1.10", "192.168.1.11", "192.168.1.12"]
    external_apis = ["1.1.1.1", "8.8.8.8", "20.15.30.12"] # 20.x might be OpenAI
    shadow_ai = ["104.18.20.12"] # Unknown

    while True:
        src = random.choice(internal_services)
        if random.random() > 0.7:
             dst = random.choice(external_apis + shadow_ai)
             proto = Protocol.HTTPS
             port = 443
        else:
             dst = random.choice(internal_services)
             proto = Protocol.GRPC
             port = 8080

        event = NetworkFlowEvent(
            source_ip=src,
            source_port=random.randint(10000, 60000),
            destination_ip=dst,
            destination_port=port,
            protocol=proto,
            bytes_sent=random.randint(100, 5000),
            bytes_received=random.randint(100, 5000)
        )
        
        topic = os.getenv("SH_KAFKA_TOPIC", "sh.telemetry.traffic.v1")
        await broker.publish(topic, event)
        logger.info(f"Simulated: {src} -> {dst}")
        
        await asyncio.sleep(random.uniform(0.5, 2.0))

if __name__ == "__main__":
    try:
        asyncio.run(simulator())
    except KeyboardInterrupt:
        pass
