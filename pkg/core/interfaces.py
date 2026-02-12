from abc import ABC, abstractmethod
from typing import List, Dict, Any, Callable, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class EventBroker(ABC):
    """
    Abstract interface for a message broker (Kafka, Memory, etc).
    """
    @abstractmethod
    async def start(self):
        pass

    @abstractmethod
    async def stop(self):
        pass

    @abstractmethod
    async def publish(self, topic: str, event: BaseModel):
        """Publish an event to a topic."""
        pass

    @abstractmethod
    async def subscribe(self, topic: str, callback: Callable[[BaseModel], Any]):
        """
        Subscribe to a topic.
        The callback should accept a Pydantic model.
        """
        pass

class GraphStore(ABC):
    """
    Abstract interface for a graph database (Neo4j, NetworkX, etc).
    """
    @abstractmethod
    async def add_node(self, node_id: str, labels: List[str], properties: Dict[str, Any]):
        """Add or update a node."""
        pass

    @abstractmethod
    async def add_edge(self, source_id: str, target_id: str, relation_type: str, properties: Dict[str, Any]):
        """Add or update an edge."""
        pass

    @abstractmethod
    async def get_all_nodes(self) -> List[Dict[str, Any]]:
        """Retrieve all nodes."""
        pass

    @abstractmethod
    async def get_all_edges(self) -> List[Dict[str, Any]]:
        """Retrieve all edges."""
        pass
