import asyncio
from typing import Dict, List, Callable, Any, Set
from pydantic import BaseModel
from loguru import logger
from pkg.core.interfaces import EventBroker

class MemoryBroker(EventBroker):
    """
    In-memory message broker using asyncio.Queue.
    Supports pub/sub for local development without Kafka.
    """
    def __init__(self):
        self._queues: Dict[str, asyncio.Queue] = {}
        self._subscribers: Dict[str, List[Callable]] = {}
        self._running = False
        self._worker_task = None

    async def start(self):
        self._running = True
        self._worker_task = asyncio.create_task(self._process_queues())
        logger.info("MemoryBroker started.")

    async def stop(self):
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("MemoryBroker stopped.")

    async def publish(self, topic: str, event: BaseModel):
        if topic not in self._queues:
            self._queues[topic] = asyncio.Queue()
        
        await self._queues[topic].put(event)
        # logger.debug(f"Published to {topic}: {event}")

    async def subscribe(self, topic: str, callback: Callable[[BaseModel], Any]):
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        self._subscribers[topic].append(callback)
        logger.info(f"Subscribed callback to {topic}")

    async def _process_queues(self):
        """Background loop to dispatch events to subscribers."""
        while self._running:
            for topic in list(self._queues.keys()):
                queue = self._queues[topic]
                if not queue.empty():
                    event = await queue.get()
                    if topic in self._subscribers:
                        for callback in self._subscribers[topic]:
                            try:
                                # Execute callback (can be async or sync)
                                if asyncio.iscoroutinefunction(callback):
                                    await callback(event)
                                else:
                                    callback(event)
                            except Exception as e:
                                logger.error(f"Error in subscriber callback for {topic}: {e}")
                    queue.task_done()
            
            await asyncio.sleep(0.01) # Yield control
