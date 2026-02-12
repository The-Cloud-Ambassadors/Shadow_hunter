import React, { useState, useEffect } from "react";
import GraphView from "./GraphView";
import Alerts from "./Alerts";
import { fetchGraphData, fetchAlerts } from "./api";
import {
  Shield,
  Activity,
  Lock,
  Cpu,
  Globe,
  LayoutDashboard,
  Network,
  Settings,
  Bell,
  Search,
  AlertTriangle,
  Server,
  Wifi,
  Eye,
  ArrowRight,
  ChevronRight,
  Monitor,
  Database,
  Radio,
} from "lucide-react";

function App() {
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    nodes: 0,
    edges: 0,
    alerts: 0,
    shadowCount: 0,
  });
  const [nodeList, setNodeList] = useState([]);
  const [alertCount, setAlertCount] = useState(0);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch stats for all tabs
  useEffect(() => {
    const fetchStats = async () => {
      const [graphData, alertsData] = await Promise.all([
        fetchGraphData(),
        fetchAlerts(),
      ]);
      const shadowNodes = graphData.nodes.filter(
        (n) => n.data.type === "shadow",
      );
      setStats({
        nodes: graphData.nodes.length,
        edges: graphData.edges.length,
        alerts: alertsData.length,
        shadowCount: shadowNodes.length,
      });
      setNodeList(graphData.nodes.map((n) => n.data));
      setAlertCount(alertsData.length);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen bg-sh-bg text-slate-200 font-sans flex overflow-hidden selection:bg-red-500/30">
      {/* 1. Sidebar */}
      <aside className="w-16 flex-none bg-sh-panel border-r border-sh-border flex flex-col items-center py-4 gap-6 z-30">
        <div className="w-10 h-10 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <Shield className="w-6 h-6" />
        </div>

        <nav className="flex flex-col gap-4 w-full px-2">
          <NavItem
            icon={<LayoutDashboard />}
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            tooltip="Dashboard"
          />
          <NavItem
            icon={<Network />}
            active={activeTab === "network"}
            onClick={() => setActiveTab("network")}
            tooltip="Network"
          />
          <NavItem
            icon={<Bell />}
            active={activeTab === "alerts"}
            badge={alertCount > 0 ? alertCount : null}
            onClick={() => setActiveTab("alerts")}
            tooltip="Alerts"
          />
          <NavItem
            icon={<Settings />}
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            tooltip="Settings"
          />
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
        </div>
      </aside>

      {/* 2. Main Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex-none border-b border-sh-border flex items-center justify-between px-6 bg-sh-bg/80 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-widest text-white font-mono">
              SHADOW<span className="text-red-500">HUNTER</span>
              <span className="text-[10px] ml-2 text-slate-500 px-1.5 py-0.5 border border-slate-700 rounded bg-slate-900">
                v2.0
              </span>
            </h1>
            <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold ml-4 border-l border-slate-800 pl-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              DEMO MODE
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH..."
                className="bg-sh-panel border border-sh-border rounded-full py-1.5 pl-9 pr-4 text-xs font-mono w-56 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-300 placeholder:text-slate-600"
              />
            </div>
            <div className="text-right border-l border-sh-border pl-6">
              <div className="text-xl font-mono font-light leading-none tracking-tight text-slate-300">
                {time.toLocaleTimeString([], { hour12: false })}
              </div>
              <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">
                UTC / ZULU
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden relative">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.04] pointer-events-none"></div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="h-full flex p-3 gap-3">
              {/* Graph */}
              <div className="flex-1 h-full min-w-0 relative bg-sh-panel/30 border border-sh-border rounded-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-slate-700/50 rounded-tl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-slate-700/50 rounded-br-lg"></div>
                <GraphView />
                {/* Floating Stats */}
                <div className="absolute top-3 left-3 right-3 flex gap-3 pointer-events-none z-10">
                  <StatCard
                    label="NODES"
                    value={stats.nodes}
                    icon={<Monitor className="text-blue-400" />}
                  />
                  <StatCard
                    label="CONNECTIONS"
                    value={stats.edges}
                    icon={<Activity className="text-cyan-400" />}
                  />
                  <StatCard
                    label="THREATS"
                    value={stats.shadowCount}
                    icon={<AlertTriangle className="text-red-400" />}
                    borderColor="border-red-500/30"
                  />
                </div>
              </div>
              {/* Alerts Panel */}
              <div className="w-[360px] flex-none">
                <Alerts />
              </div>
            </div>
          )}

          {/* Network Tab */}
          {activeTab === "network" && (
            <NetworkView nodes={nodeList} stats={stats} />
          )}

          {/* Alerts Tab */}
          {activeTab === "alerts" && (
            <div className="h-full p-3">
              <Alerts />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Network View — Full-screen node inventory
// ═══════════════════════════════════════════════════════
const NetworkView = ({ nodes, stats }) => {
  const [filter, setFilter] = useState("all");
  const filtered = nodes.filter((n) => filter === "all" || n.type === filter);

  return (
    <div className="h-full flex flex-col p-3 gap-3">
      {/* Stats Bar */}
      <div className="flex gap-3">
        <MiniStat
          icon={<Server />}
          label="Total Nodes"
          value={stats.nodes}
          color="text-blue-400"
        />
        <MiniStat
          icon={<Monitor />}
          label="Internal"
          value={nodes.filter((n) => n.type === "internal").length}
          color="text-sky-400"
        />
        <MiniStat
          icon={<Globe />}
          label="External"
          value={nodes.filter((n) => n.type === "external").length}
          color="text-emerald-400"
        />
        <MiniStat
          icon={<AlertTriangle />}
          label="Shadow AI"
          value={nodes.filter((n) => n.type === "shadow").length}
          color="text-red-400"
        />
        <MiniStat
          icon={<Wifi />}
          label="Connections"
          value={stats.edges}
          color="text-cyan-400"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2">
        {["all", "internal", "external", "shadow"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider transition-all ${
              filter === f
                ? f === "shadow"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-sh-panel text-slate-500 border border-sh-border hover:text-slate-300 hover:border-slate-600"
            }`}
          >
            {f === "all" ? "All Nodes" : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-sh-panel border border-sh-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[50px_1fr_120px_200px] gap-0 text-[10px] font-mono uppercase tracking-widest text-slate-500 border-b border-sh-border bg-slate-900/50 px-4 py-2.5">
          <span>#</span>
          <span>Node ID</span>
          <span>Type</span>
          <span>Last Seen</span>
        </div>
        <div className="overflow-y-auto h-[calc(100%-40px)] custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm font-mono">
              No nodes discovered yet...
            </div>
          ) : (
            filtered.map((node, i) => (
              <div
                key={node.id}
                className="grid grid-cols-[50px_1fr_120px_200px] gap-0 px-4 py-2.5 border-b border-sh-border/50 hover:bg-slate-800/40 transition-colors text-sm items-center"
              >
                <span className="text-slate-600 text-xs font-mono">
                  {i + 1}
                </span>
                <span className="font-mono text-slate-200 truncate pr-4">
                  {node.label || node.id}
                </span>
                <TypeBadge type={node.type} />
                <span className="text-slate-500 text-xs font-mono">
                  {node.last_seen
                    ? new Date(node.last_seen).toLocaleTimeString([], {
                        hour12: false,
                      })
                    : "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Settings View
// ═══════════════════════════════════════════════════════
const SettingsView = () => {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-mono font-bold text-slate-200 flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-slate-400" /> SYSTEM_CONFIG
        </h2>

        <SettingsGroup title="Detection Engine">
          <SettingRow
            label="Shadow AI Detection"
            description="Flag traffic to known AI services"
            defaultOn={true}
          />
          <SettingRow
            label="Anomalous Port Detection"
            description="Alert on non-standard outbound ports"
            defaultOn={true}
          />
          <SettingRow
            label="DNS Tunneling Detection"
            description="Detect large DNS payloads"
            defaultOn={true}
          />
        </SettingsGroup>

        <SettingsGroup title="Traffic Capture">
          <SettingRow
            label="Demo Mode"
            description="Simulate corporate traffic for demonstration"
            defaultOn={true}
          />
          <SettingRow
            label="Live Packet Capture"
            description="Requires Npcap driver (not installed)"
            defaultOn={false}
            disabled={true}
          />
        </SettingsGroup>

        <SettingsGroup title="Dashboard">
          <SettingRow
            label="Auto-refresh Interval"
            description="Fetch new data every 5 seconds"
            defaultOn={true}
          />
          <SettingRow
            label="Sound Alerts"
            description="Play audio on HIGH severity alerts"
            defaultOn={false}
          />
        </SettingsGroup>

        <div className="mt-8 p-4 bg-slate-900/50 border border-sh-border rounded-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
            System Info
          </div>
          <div className="space-y-1 text-xs font-mono text-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-500">Version</span>
              <span>2.0.0-demo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mode</span>
              <span className="text-green-400">DEMO (Simulated)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Backend</span>
              <span>localhost:8000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Npcap</span>
              <span className="text-amber-400">Not Installed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════

const NavItem = ({ icon, active, badge, onClick, tooltip }) => (
  <button
    onClick={onClick}
    title={tooltip}
    className={`w-full aspect-square flex items-center justify-center rounded-xl transition-all relative ${
      active
        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
        : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
    }`}
  >
    {React.cloneElement(icon, { size: 20 })}
    {badge && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 rounded-full text-[9px] font-bold text-white px-1 border-2 border-sh-panel">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </button>
);

const StatCard = ({ label, value, icon, borderColor = "border-sh-border" }) => (
  <div
    className={`bg-sh-bg/90 backdrop-blur-md border ${borderColor} rounded-lg px-3 py-2 flex items-center gap-2.5 shadow-lg pointer-events-auto`}
  >
    <div className="p-1.5 bg-slate-900 rounded-md">
      {React.cloneElement(icon, { size: 14 })}
    </div>
    <div>
      <div className="text-[9px] text-slate-500 font-bold tracking-wider">
        {label}
      </div>
      <div className="text-sm font-mono font-bold text-slate-200">{value}</div>
    </div>
  </div>
);

const MiniStat = ({ icon, label, value, color }) => (
  <div className="flex-1 bg-sh-panel border border-sh-border rounded-xl p-3 flex items-center gap-3">
    <div className={`${color}`}>{React.cloneElement(icon, { size: 18 })}</div>
    <div>
      <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
        {label}
      </div>
      <div className="text-lg font-mono font-bold text-slate-200">{value}</div>
    </div>
  </div>
);

const TypeBadge = ({ type }) => {
  const styles = {
    internal: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    external: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    shadow: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${styles[type] || "text-slate-500 border-slate-700"}`}
    >
      {type || "unknown"}
    </span>
  );
};

const SettingsGroup = ({ title, children }) => (
  <div className="bg-sh-panel border border-sh-border rounded-xl overflow-hidden">
    <div className="px-4 py-2.5 border-b border-sh-border bg-slate-900/50 text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
      {title}
    </div>
    <div className="divide-y divide-sh-border/50">{children}</div>
  </div>
);

const SettingRow = ({
  label,
  description,
  defaultOn = false,
  disabled = false,
}) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${disabled ? "opacity-40" : "hover:bg-slate-800/30"} transition-colors`}
    >
      <div>
        <div className="text-sm text-slate-200">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <button
        onClick={() => !disabled && setOn(!on)}
        className={`w-10 h-5 rounded-full transition-all relative ${on ? "bg-blue-500" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-5.5" : "left-0.5"}`}
          style={{ left: on ? "22px" : "2px" }}
        />
      </button>
    </div>
  );
};

export default App;
