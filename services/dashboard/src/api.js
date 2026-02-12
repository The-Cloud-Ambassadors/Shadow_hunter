import axios from "axios";

const API_BASE_URL = "http://localhost:8000/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchGraphData = async () => {
  try {
    const [nodesRes, edgesRes] = await Promise.all([
      apiClient.get("/discovery/nodes"),
      apiClient.get("/discovery/edges"),
    ]);

    const nodes = nodesRes.data.map((node) => ({
      data: { ...node, label: node.label || node.id },
    }));

    const edges = edgesRes.data.map((edge) => ({
      data: { ...edge, id: `${edge.source}-${edge.target}` },
    }));

    return { nodes, edges };
  } catch (error) {
    console.error("Failed to fetch graph data:", error);
    return { nodes: [], edges: [] };
  }
};

export const fetchAlerts = async () => {
  try {
    const res = await apiClient.get("/policy/alerts");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return [];
  }
};
