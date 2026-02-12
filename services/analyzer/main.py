import asyncio
import os
import signal
from loguru import logger
from services.analyzer.engine import AnalyzerEngine

# Configuration
SH_ENV = os.getenv("SH_ENV", "local").lower()
KAFKA_BOOTSTRAP = os.getenv("SH_KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")

async def main():
    logger.info(f"Starting Analyzer Service in {SH_ENV.upper()} mode")

    # Dependency Injection based on Environment
    if SH_ENV == "production":
        from pkg.infra.enterprise.broker import KafkaBroker
        from pkg.infra.enterprise.store import Neo4jStore
        
        broker = KafkaBroker(KAFKA_BOOTSTRAP)
        # Authentication would be handled securely here
        store = Neo4jStore(NEO4J_URI, auth=("neo4j", "password"))
    else:
        from pkg.infra.local.broker import MemoryBroker
        from pkg.infra.local.store import NetworkXStore
        
        broker = MemoryBroker()
        store = NetworkXStore()

    # Initialize Engine
    engine = AnalyzerEngine(broker, store)

    # Start Infrastructure
    await broker.start()
    # Store might not need explicit start, but good practice to check logic

    # Start Engine
    await engine.start()

    # Keep running
    try:
        # In a real app we'd wait on a signal
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        await broker.stop()
        if hasattr(store, 'close'):
            await store.close()
        logger.info("Analyzer Service stopped")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
