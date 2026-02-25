import axios from "axios";

const API_BASE_URL = "http://localhost:8000/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "shadow-hunter-dev", // Required for POST/write operations
  },
});

export const fetchStatus = async () => {
  try {
    const res = await apiClient.get("/status");
    return res.data;
  } catch {
    return { mode: "demo" };
  }
};

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

export const fetchRiskScores = async () => {
  try {
    const res = await apiClient.get("/discovery/risk-scores");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch risk scores:", error);
    return [];
  }
};

export const fetchReport = async () => {
  try {
    const res = await apiClient.get("/policy/report");
    return res.data;
  } catch (error) {
    console.error("Failed to generate report:", error);
    return null;
  }
};

export const fetchTrafficStats = async () => {
  try {
    const res = await apiClient.get("/discovery/traffic-stats");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch traffic stats:", error);
    return null;
  }
};

export const fetchTimeline = async () => {
  try {
    const res = await apiClient.get("/policy/timeline");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch timeline:", error);
    return null;
  }
};

export const fetchProfiles = async () => {
  try {
    const res = await apiClient.get("/policy/profiles");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch profiles:", error);
    return [];
  }
};

export const fetchSessions = async () => {
  try {
    const res = await apiClient.get("/policy/sessions");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return [];
  }
};

export const fetchRules = async () => {
  try {
    const res = await apiClient.get("/policy/rules");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch rules:", error);
    return [];
  }
};

export const createRule = async (rule) => {
  try {
    const res = await apiClient.post("/policy/rules", rule);
    return res.data;
  } catch (error) {
    console.error("Failed to create rule:", error);
    return null;
  }
};

export const toggleRule = async (ruleId) => {
  try {
    const res = await apiClient.put(`/policy/rules/${ruleId}/toggle`);
    return res.data;
  } catch (error) {
    console.error("Failed to toggle rule:", error);
    return null;
  }
};

export const deleteRule = async (ruleId) => {
  try {
    const res = await apiClient.delete(`/policy/rules/${ruleId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to delete rule:", error);
    return null;
  }
};

export const fetchDlpIncidents = async () => {
  try {
    const res = await apiClient.get("/policy/dlp");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch DLP incidents:", error);
    return {
      incidents: [],
      summary: { total_incidents: 0, high_severity: 0, types: {} },
    };
  }
};

export const fetchKillchain = async () => {
  try {
    const res = await apiClient.get("/policy/killchain");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch kill chain:", error);
    return {
      stages: [],
      total_alerts: 0,
      active_stages: 0,
      chain_completion: 0,
    };
  }
};

export const fetchBriefing = async () => {
  try {
    const res = await apiClient.get("/policy/briefing");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch briefing:", error);
    return { paragraphs: [], generated_at: "", period: "" };
  }
};

// ── Defense / Kill-Switch APIs ──────────────────────────────────────────
export const fetchQuarantinedNodes = async () => {
  try {
    const res = await apiClient.get("/defense/quarantined");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch quarantined nodes:", error);
    return { active_count: 0, active: [], released: [] };
  }
};

export const quarantineNode = async (ip, reason = "Manual quarantine") => {
  try {
    const res = await apiClient.post("/defense/quarantine", {
      ip,
      reason,
      auto: false,
    });
    return res.data;
  } catch (error) {
    console.error("Failed to quarantine node:", error);
    return null;
  }
};

export const releaseNode = async (ip) => {
  try {
    const res = await apiClient.post("/defense/release", {
      ip,
      released_by: "security_analyst",
    });
    return res.data;
  } catch (error) {
    console.error("Failed to release node:", error);
    return null;
  }
};

// ── Policy & Compliance APIs ──────────────────────────────────────────────
export const fetchCompliance = async () => {
  try {
    const res = await apiClient.get("/compliance/stats"); // 👈 Updated to new Enterprise API
    return res.data;
  } catch (error) {
    console.error("Failed to fetch compliance:", error);
    return { overall_compliance_score: 0, frameworks: [], summary: {} };
  }
};

export const fetchComplianceViolations = async () => {
  try {
    const res = await apiClient.get("/compliance/violations");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch compliance violations:", error);
    return { total: 0, violations: [] };
  }
};

export const fetchComplianceAuditLog = async () => {
  try {
    const res = await apiClient.get("/compliance/audit-log");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch audit log:", error);
    return { total_events: 0, entries: [] };
  }
};
