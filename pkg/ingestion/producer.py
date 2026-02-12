import json
import asyncio
import os
from typing import Generic, TypeVar, Optional
from aiokafka import AIOKafkaProducer
from pydantic import BaseModel
from loguru import logger

T = TypeVar("T", bound=BaseModel)

MOCK_MODE = os.getenv("SH_MOCK_KAFKA", "false").lower() == "true"

class KafkaProducerWrapper(Generic[T]):
    def __init__(self, bootstrap_servers: str, topic: str):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.producer: Optional[AIOKafkaProducer] = None

    async def start(self):
        if MOCK_MODE:
            logger.warning(f"MOCK MODE: Kafka producer caching events for topic: {self.topic}")
            return
            
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: v.model_dump_json().encode("utf-8")
        )
        await self.producer.start()
        logger.info(f"Kafka producer started for topic: {self.topic}")

    async def stop(self):
        if self.producer:
            await self.producer.stop()
        logger.info("Kafka producer stopped")

    async def send(self, event: T):
        if MOCK_MODE:
            logger.info(f"[MOCK KAFKA] Send to {self.topic}: {event.model_dump_json()[:100]}...")
            return

        if not self.producer:
            raise RuntimeError("Producer not started")
        try:
            await self.producer.send_and_wait(self.topic, event)
            pass
        except Exception as e:
            logger.error(f"Failed to send event to Kafka: {e}")
            raise
