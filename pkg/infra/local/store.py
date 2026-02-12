import networkx as nx
from typing import List, Dict, Any
from pkg.core.interfaces import GraphStore
from loguru import logger

class NetworkXStore(GraphStore):
    """
    In-memory graph store using NetworkX.
    Exports to JSON for frontend visualization.
    """
    def __init__(self):
        self.graph = nx.DiGraph()

    async def add_node(self, node_id: str, labels: List[str], properties: Dict[str, Any]):
        # Merge properties if node exists
        if self.graph.has_node(node_id):
            current = self.graph.nodes[node_id]
            current.update(properties)
            current["labels"] = list(set(current.get("labels", []) + labels))
        else:
            self.graph.add_node(node_id, labels=labels, **properties)
        
        # logger.debug(f"Graph: Node updated {node_id}")

    async def add_edge(self, source_id: str, target_id: str, relation_type: str, properties: Dict[str, Any]):
        if not self.graph.has_node(source_id):
            await self.add_node(source_id, ["Unknown"], {})
        if not self.graph.has_node(target_id):
            await self.add_node(target_id, ["Unknown"], {})

        # NetworkX multigraph support would be better for multiple edge types, 
        # but DiGraph is fine for MVP simple dependencies.
        self.graph.add_edge(source_id, target_id, relation=relation_type, **properties)
        # logger.debug(f"Graph: Edge {source_id} -> {target_id}")

    async def get_all_nodes(self) -> List[Dict[str, Any]]:
        nodes = []
        for n, attr in self.graph.nodes(data=True):
            nodes.append({"id": n, **attr})
        return nodes

    async def get_all_edges(self) -> List[Dict[str, Any]]:
        edges = []
        for u, v, attr in self.graph.edges(data=True):
            edges.append({"source": u, "target": v, **attr})
        return edges
