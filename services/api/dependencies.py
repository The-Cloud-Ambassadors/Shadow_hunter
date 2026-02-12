from typing import Optional
from pkg.core.interfaces import GraphStore

# Global singleton for dependency injection
_graph_store: Optional[GraphStore] = None

def get_graph_store() -> GraphStore:
    if not _graph_store:
        raise RuntimeError("GraphStore not initialized")
    return _graph_store

def set_graph_store(store: GraphStore):
    global _graph_store
    _graph_store = store
