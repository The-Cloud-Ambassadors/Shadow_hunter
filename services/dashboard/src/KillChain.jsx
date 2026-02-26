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
    color: "#3b82f6", // Blue
    gradient: "from-blue-500/20 to-blue-500/5",
    accent: "bg-blue-500",
    description: "Scanning & enumeration",
  },
  {
    id: "initial_access",
    label: "Initial Access",
    icon: <KeyRound size={22} />,
    color: "#8b5cf6", // Violet
    gradient: "from-violet-500/20 to-violet-500/5",
    accent: "bg-violet-500",
    description: "Payload delivery & exploitation",
  },
  {
    id: "execution",
    label: "Execution",
    icon: <Cpu size={22} />,
    color: "#f59e0b", // Amber
    gradient: "from-amber-500/20 to-amber-500/5",
    accent: "bg-amber-500",
    description: "Malicious code execution",
  },
  {
    id: "exfiltration",
    label: "Exfiltration",
    icon: <Upload size={22} />,
    color: "#ef4444", // Red
    gradient: "from-red-500/20 to-red-500/5",
    accent: "bg-red-500",
    description: "Data theft & egress",
  },
  {
    id: "impact",
    label: "Impact",
    icon: <Flame size={22} />,
    color: "#dc2626", // Dark Red
    gradient: "from-rose-600/20 to-rose-600/5",
    accent: "bg-rose-600",
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

  // Data Polling
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

  // Auto-Select Active Stage
  useEffect(() => {
    if (!expandedStage && data.stages && data.stages.length > 0) {
      const active = data.stages.find((s) => s.active);
      if (active) setExpandedStage(active.id);
      else setExpandedStage(STAGE_CONFIG[0].id); // Default to first if none active
    }
  }, [data, expandedStage]);

  const { stages, chain_completion } = data;

  const activeStageData = stages?.find((s) => s.id === expandedStage) || { alerts: [], count: 0 };
  const activeCfg = STAGE_CONFIG.find((c) => c.id === expandedStage) || STAGE_CONFIG[0];


  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 dark:bg-red-500/10 p-2.5 rounded-xl border border-red-200 dark:border-red-500/20">
            <Target className="text-red-500 dark:text-red-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Kill Chain Analysis
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${chain_completion > 0 ? "bg-red-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"}`}
              />
              {chain_completion}% Threat Progression Pipeline
            </div>
          </div>
        </div>

        {/* Progress Mini-Bar */}
        <div className="w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 transition-all duration-1000 ease-out"
            style={{ width: `${chain_completion}%` }}
          />
        </div>
      </div>

      {/* ── SEAMLESS PIPELINE VISUALIZATION ── */}
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
                  ${isSelected ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/50 scale-105 z-10' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 opacity-70 hover:opacity-100'}
                `}
              >
                  {/* Icon Container */}
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-300
                      ${isSelected || isActive 
                          ? `bg-opacity-10 ${cfg.accent} bg-white dark:bg-transparent` 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }
                    `}
                    style={{ 
                      color: isSelected || isActive ? cfg.color : undefined,
                      backgroundColor: (isSelected || isActive) ? `${cfg.color}15` : undefined
                    }}
                  >
                    {cfg.icon}
                  </div>

                  {/* Label */}
                  <div className={`text-xs font-semibold tracking-wide text-center transition-colors ${isSelected ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                    {cfg.label}
                  </div>

                  {/* Threat Badge */}
                  {stageData.count > 0 && (
                     <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse ring-2 ring-white dark:ring-slate-900">
                        {stageData.count}
                     </div>
                  )}
                  
                  {/* Subtle connection hint (not a hard line) */}
                  {index < STAGE_CONFIG.length - 1 && (
                      <div className={`absolute -right-3 top-1/2 w-4 h-px ${isPast ? 'bg-slate-300 dark:bg-slate-600' : 'bg-transparent'} -translate-y-1/2 pointer-events-none`} />
                  )}
              </div>
            );
          })}
      </div>

      {/* ── SEAMLESS DETAILS PANEL ── */}
      <div className="flex-1 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Panel Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r ${activeCfg.gradient}`}>
           <div>
              <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                 <span style={{color: activeCfg.color}}>{activeCfg.icon}</span>
                 {activeCfg.label} Stage Details
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{activeCfg.description}</p>
           </div>
           
           <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
              <Activity size={14} className="text-slate-500" />
              <span className="text-xs font-medium dark:text-slate-300">{activeStageData.alerts.length} Detected Events</span>
           </div>
        </div>

        {/* Panel Body (List) */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeStageData.alerts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeStageData.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="group flex gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 transition-all"
                >
                  <div className="pt-1">
                    <div className={`w-2 h-2 rounded-full ${SEV_DOT[alert.severity] || "bg-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {alert.description || "Suspicious activity detected in this phase."}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded truncate max-w-[120px]">
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
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
              <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-900/50">
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
