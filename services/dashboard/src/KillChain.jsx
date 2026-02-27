import React, { useState, useEffect } from "react";
import { fetchKillchain } from "./api";
import {
  Search,
  KeyRound,
  Cpu,
  Upload,
  Flame,
  Activity,
  ShieldAlert,
  Target,
} from "lucide-react";

const STAGE_CONFIG = [
  {
    id: "reconnaissance",
    label: "Reconnaissance",
    icon: <Search size={22} />,
    color: "#3b82f6",
    bgLight: "rgba(59,130,246,0.08)",
    description: "Scanning & enumeration",
  },
  {
    id: "initial_access",
    label: "Initial Access",
    icon: <KeyRound size={22} />,
    color: "#8b5cf6",
    bgLight: "rgba(139,92,246,0.08)",
    description: "Payload delivery & exploitation",
  },
  {
    id: "execution",
    label: "Execution",
    icon: <Cpu size={22} />,
    color: "#f59e0b",
    bgLight: "rgba(245,158,11,0.08)",
    description: "Malicious code execution",
  },
  {
    id: "exfiltration",
    label: "Exfiltration",
    icon: <Upload size={22} />,
    color: "#ef4444",
    bgLight: "rgba(239,68,68,0.08)",
    description: "Data theft & egress",
  },
  {
    id: "impact",
    label: "Impact",
    icon: <Flame size={22} />,
    color: "#dc2626",
    bgLight: "rgba(220,38,38,0.08)",
    description: "System compromise or disruption",
  },
];

const SEV_DOT = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-blue-500",
};

const KillChain = () => {
  const [data, setData] = useState({
    stages: [],
    total_alerts: 0,
    active_stages: 0,
    chain_completion: 0,
  });
  const [expandedStage, setExpandedStage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchKillchain();
        if (result && result.stages) setData(result);
      } catch (e) {
        console.error("Failed to load killchain data", e);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!expandedStage && data.stages && data.stages.length > 0) {
      const active = data.stages.find((s) => s.active);
      if (active) setExpandedStage(active.id);
      else setExpandedStage(STAGE_CONFIG[0].id);
    }
  }, [data, expandedStage]);

  const { stages, chain_completion } = data;
  const activeStageData = stages?.find((s) => s.id === expandedStage) || { alerts: [], count: 0 };
  const activeCfg = STAGE_CONFIG.find((c) => c.id === expandedStage) || STAGE_CONFIG[0];

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden text-sh-text transition-colors duration-300">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
            <Target className="text-red-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-sh-text">
              Kill Chain Analysis
            </h2>
            <div className="flex items-center gap-2 text-xs text-sh-text-muted mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${chain_completion > 0 ? "bg-red-500 animate-pulse" : "bg-slate-400"}`}
              />
              {chain_completion}% Threat Progression Pipeline
            </div>
          </div>
        </div>

        <div className="w-48 h-2 bg-sh-border rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 transition-all duration-1000 ease-out"
            style={{ width: `${chain_completion}%` }}
          />
        </div>
      </div>

      {/* ── PIPELINE VISUALIZATION ── */}
      <div className="flex justify-between items-stretch gap-2 mb-6">
        {STAGE_CONFIG.map((cfg, index) => {
          const stageData = stages?.find((s) => s.id === cfg.id) || { active: false, count: 0 };
          const isActive = stageData.active;
          const isSelected = expandedStage === cfg.id;
          const isPast = index < STAGE_CONFIG.findIndex(c => c.id === expandedStage);

          return (
            <div
              key={cfg.id}
              onClick={() => setExpandedStage(cfg.id)}
              className={`
                relative flex-1 flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all duration-300
                ${isSelected
                  ? 'bg-sh-panel shadow-sm border border-sh-border scale-105 z-10'
                  : 'hover:bg-sh-hover opacity-70 hover:opacity-100 border border-transparent'
                }
              `}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-300"
                style={{
                  color: isSelected || isActive ? cfg.color : 'var(--color-sh-text-dim)',
                  backgroundColor: isSelected || isActive ? cfg.bgLight : 'var(--color-sh-hover)',
                }}
              >
                {cfg.icon}
              </div>

              <div className={`text-xs font-semibold tracking-wide text-center transition-colors ${isSelected ? 'text-sh-text' : 'text-sh-text-muted'}`}>
                {cfg.label}
              </div>

              {stageData.count > 0 && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse ring-2 ring-sh-panel">
                  {stageData.count}
                </div>
              )}

              {index < STAGE_CONFIG.length - 1 && (
                <div className={`absolute -right-3 top-1/2 w-4 h-px ${isPast ? 'bg-sh-border' : 'bg-transparent'} -translate-y-1/2 pointer-events-none`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── DETAILS PANEL ── */}
      <div className="flex-1 bg-sh-panel rounded-2xl border border-sh-border shadow-sm overflow-hidden flex flex-col transition-all duration-300">

        {/* Panel Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b border-sh-border"
          style={{ background: `linear-gradient(to right, ${activeCfg.bgLight}, transparent)` }}
        >
          <div>
            <h3 className="text-lg font-semibold text-sh-text flex items-center gap-2">
              <span style={{ color: activeCfg.color }}>{activeCfg.icon}</span>
              {activeCfg.label} Stage Details
            </h3>
            <p className="text-sm text-sh-text-muted mt-0.5">{activeCfg.description}</p>
          </div>

          <div className="flex items-center gap-2 bg-sh-surface px-3 py-1.5 rounded-lg border border-sh-border backdrop-blur-sm">
            <Activity size={14} className="text-sh-text-muted" />
            <span className="text-xs font-medium text-sh-text-secondary">{activeStageData.alerts.length} Detected Events</span>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeStageData.alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeStageData.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="group flex gap-3 p-3 rounded-xl hover:bg-sh-hover border border-transparent hover:border-sh-border transition-all"
                >
                  <div className="pt-1">
                    <div className={`w-2 h-2 rounded-full ${SEV_DOT[alert.severity] || "bg-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-sh-text mb-1 leading-tight group-hover:text-blue-500 transition-colors">
                      {alert.description || "Suspicious activity detected in this phase."}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-sh-text-muted font-mono">
                      <span className="bg-sh-surface px-1.5 py-0.5 rounded truncate max-w-[120px] border border-sh-border">
                        {alert.source || "Unknown Source"}
                      </span>
                      <span>
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-sh-text-dim gap-3">
              <div className="p-4 rounded-full bg-sh-surface">
                <ShieldAlert size={32} strokeWidth={1.5} className="opacity-50" />
              </div>
              <span className="text-sm font-medium">
                No threat activity tracked in the {activeCfg.label} stage.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KillChain;
