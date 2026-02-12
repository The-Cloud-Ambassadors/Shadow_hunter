# Development standards & Scaffolding

## Naming Standards

### Services

Kebab-case, descriptive.

- `sh-traffic-analyzer`
- `sh-graph-worker`

### Events

`(Domain).(Entity).(Version).(Action)`.

- `telemetry.flow.v1.observed`
- `analysis.incident.v1.created`

### Kafka Topics

`sh.{environment}.{service}.{event_type}`.

- `sh.prod.listener.raw_packets`

### Environment Variables

`SH_{Component}_{Setting}`.

- `SH_API_DB_HOST`
- `SH_LISTENER_CAPTURE_INTERFACE`

## Code Scaffolding Examples

### A) Clean FastAPI Service Template

```python
# services/api/main.py
from fastapi import FastAPI, Depends, HTTPException
from contextlib import asynccontextmanager
from core.config import settings
from core.logging import logger
from routers import discovery, policy

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Service starting...")
    # Initialize DB pools, Kafka producers
    yield
    logger.info("Service shutting down...")

app = FastAPI(
    title="Shadow Hunter Control Plane",
    version=settings.VERSION,
    lifespan=lifespan
)

app.include_router(discovery.router, prefix="/v1/discovery", tags=["Discovery"])
app.include_router(policy.router, prefix="/v1/policy", tags=["Policy"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.VERSION}
```

### B) Kafka Consumer (Clean Data Processing)

```python
# pkg/ingestion/consumer.py
import asyncio
from aiokafka import AIOKafkaConsumer
from core.models.events import NetworkFlowEvent
from core.processors import FlowProcessor

class TrafficConsumer:
    def __init__(self, topic: str, bootstrap_servers: str, processor: FlowProcessor):
        self.consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            group_id="shadow_hunter_analyzer"
        )
        self.processor = processor

    async def start(self):
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                event = NetworkFlowEvent.model_validate_json(msg.value)
                await self.processor.process(event)
        finally:
            await self.consumer.stop()
```

### C) Configuration Management (Pydantic)

```python
# core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    VERSION: str = "0.1.0"
    ENV: str = "production"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str
    KAFKA_TOPIC_TRAFFIC: str = "sh.telemetry.traffic.v1"

    # Database
    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```
