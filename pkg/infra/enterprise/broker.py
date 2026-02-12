import asyncio
import json
from typing import Callable, Any
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from pydantic import BaseModel
from loguru import logger
from pkg.core.interfaces import EventBroker

class KafkaBroker(EventBroker):
    """
    Enterprise message broker using AIOKafka.
    """
    def __init__(self, bootstrap_servers: str):
        self.bootstrap_servers = bootstrap_servers
        self.producer = None
        self.consumers = []
        self.params = {
            "bootstrap_servers": bootstrap_servers,
            "value_serializer": lambda v: v.model_dump_json().encode("utf-8"),
            "value_deserializer": lambda v: json.loads(v.decode("utf-8"))
        }

    async def start(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=self.params["value_serializer"]
        )
        await self.producer.start()
        logger.info(f"KafkaBroker connected to {self.bootstrap_servers}")

    async def stop(self):
        if self.producer:
            await self.producer.stop()
        for consumer in self.consumers:
            await consumer.stop()
        logger.info("KafkaBroker stopped.")

    async def publish(self, topic: str, event: BaseModel):
        if not self.producer:
            raise RuntimeError("KafkaBroker not started")
        try:
            await self.producer.send_and_wait(topic, event)
        except Exception as e:
            logger.error(f"Failed to publish to Kafka: {e}")

    async def subscribe(self, topic: str, callback: Callable[[BaseModel], Any]):
        """
        Starts a background consumer task for the topic.
        """
        consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id="shadow_hunter_analyzer",
            # Deserialization handled manually or via params if simplified
        )
        await consumer.start()
        self.consumers.append(consumer)
        
        asyncio.create_task(self._consume_loop(consumer, callback))
        logger.info(f"KafkaBroker subscribed to {topic}")

    async def _consume_loop(self, consumer, callback):
        try:
            async for msg in consumer:
                # We need to reconstruct the Pydantic model. 
                # This part requires knowing the Model Class, which `EventBroker` abstractly handles via BaseModel.
                # Ideally, the callback handles dict->Model conversion, or we pass a generic type.
                # For this implementation, we assume callback accepts a Dict or generic object.
                data = json.loads(msg.value)
                if asyncio.iscoroutinefunction(callback):
                    await callback(data)
                else:
                    callback(data)
        except Exception as e:
            logger.error(f"Kafka consumer error: {e}")
