from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from services.api.dependencies import get_graph_store
from pkg.core.interfaces import GraphStore

router = APIRouter()

@router.get("/nodes")
async def get_nodes(store: GraphStore = Depends(get_graph_store)):
    """
    Retrieve all discovered nodes from the GraphStore.
    """
    nodes = await store.get_all_nodes()
    # Format for frontend if necessary, or return as is
    return nodes

@router.get("/edges")
async def get_edges(store: GraphStore = Depends(get_graph_store)):
    """
    Retrieve all discovered dependencies from the GraphStore.
    """
    edges = await store.get_all_edges()
    return edges
