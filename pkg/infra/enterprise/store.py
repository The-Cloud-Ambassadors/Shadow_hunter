from typing import List, Dict, Any
from neo4j import AsyncGraphDatabase
from pkg.core.interfaces import GraphStore
from loguru import logger

class Neo4jStore(GraphStore):
    """
    Enterprise graph store using Neo4j.
    """
    def __init__(self, uri: str, auth: tuple):
        self.driver = AsyncGraphDatabase.driver(uri, auth=auth)

    async def close(self):
        await self.driver.close()

    async def add_node(self, node_id: str, labels: List[str], properties: Dict[str, Any]):
        # Cypher query to merge node
        label_str = "".join([f":{l}" for l in labels])
        query = f"MERGE (n{label_str} {{id: $id}}) SET n += $props"
        
        try:
            async with self.driver.session() as session:
                await session.run(query, id=node_id, props=properties)
        except Exception as e:
            logger.error(f"Neo4j add_node error: {e}")

    async def add_edge(self, source_id: str, target_id: str, relation_type: str, properties: Dict[str, Any]):
        query = f"""
        MATCH (a {{id: $source_id}}), (b {{id: $target_id}})
        MERGE (a)-[r:{relation_type}]->(b)
        SET r += $props
        """
        try:
            async with self.driver.session() as session:
                await session.run(query, source_id=source_id, target_id=target_id, props=properties)
        except Exception as e:
            logger.error(f"Neo4j add_edge error: {e}")

    async def get_all_nodes(self) -> List[Dict[str, Any]]:
        query = "MATCH (n) RETURN n"
        nodes = []
        try:
            async with self.driver.session() as session:
                result = await session.run(query)
                async for record in result:
                    node = record["n"]
                    nodes.append(dict(node))
        except Exception as e:
            logger.error(f"Neo4j get_nodes error: {e}")
        return nodes

    async def get_all_edges(self) -> List[Dict[str, Any]]:
        query = "MATCH (a)-[r]->(b) RETURN a.id as source, b.id as target, properties(r) as props, type(r) as type"
        edges = []
        try:
            async with self.driver.session() as session:
                result = await session.run(query)
                async for record in result:
                    edge = {
                        "source": record["source"],
                        "target": record["target"],
                        "relation": record["type"],
                        **record["props"]
                    }
                    edges.append(edge)
        except Exception as e:
            logger.error(f"Neo4j get_edges error: {e}")
        return edges
