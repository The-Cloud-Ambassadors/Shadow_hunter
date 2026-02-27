import React, { useState, useEffect } from "react";
import { fetchMitreMatrix } from "./api";
import { Layers, AlertTriangle, ShieldAlert } from "lucide-react";

// Severity to aesthetic classes — using theme-aware colors
const SEV_BG = {
  CRITICAL: "bg-red-500/15 border-red-500/30",
  HIGH: "bg-orange-500/15 border-orange-500/30",
  MEDIUM: "bg-amber-500/15 border-amber-500/30",
  LOW: "bg-blue-500/15 border-blue-500/30",
};
const SEV_TEXT = {
  CRITICAL: "text-red-400",
  HIGH: "text-orange-400",
  MEDIUM: "text-amber-400",
  LOW: "text-blue-400",
};

const MitreMatrix = () => {
  const [data, setData] = useState({
    matrix: [],
    active_tactics: 0,
    total_mapped_alerts: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const result = await fetchMitreMatrix();
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-sh-text-muted font-mono text-sm relative">
        <Layers className="w-12 h-12 mb-4 animate-pulse opacity-50" />
        LOADING MITRE ATT&amp;CK MATRIX...
      </div>
    );
  }

  const { matrix, active_tactics, total_mapped_alerts } = data;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-none border-b border-sh-border pb-3 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-sh-text tracking-widest uppercase flex items-center gap-2">
              MITRE ATT&amp;CK Framework
              {total_mapped_alerts > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </h2>
            <div className="text-[10px] font-mono text-sh-text-muted mt-0.5">
              Tactics actively observed:{" "}
              <span className="text-teal-400">{active_tactics}</span> | Mapped
              events:{" "}
              <span className="text-teal-400">{total_mapped_alerts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="flex h-full gap-2 min-w-max pb-2">
          {matrix.map((tactic) => {
            const isActive = tactic.total_hits > 0;
            return (
              <div
                key={tactic.tactic}
                className={`w-[260px] h-full flex flex-col rounded-xl border transition-all duration-500 overflow-hidden ${
                  isActive
                    ? "bg-sh-panel border-teal-500/30"
                    : "bg-sh-surface border-sh-border opacity-60"
                }`}
              >
                {/* Column Header */}
                <div
                  className={`p-3 border-b ${isActive ? "border-teal-500/20 bg-teal-500/5" : "border-sh-border bg-sh-surface"}`}
                >
                  <div className="flex justify-between items-center">
                    <h3
                      className={`font-mono text-xs font-bold uppercase tracking-widest truncate max-w-[80%] ${isActive ? "text-sh-text" : "text-sh-text-dim"}`}
                    >
                      {tactic.tactic}
                    </h3>
                    {isActive && (
                      <span className="text-[10px] font-mono bg-teal-500/15 text-teal-400 px-1.5 py-0.5 rounded border border-teal-500/30">
                        {tactic.total_hits}
                      </span>
                    )}
                  </div>
                </div>

                {/* Techniques List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {!isActive ? (
                    <div className="flex h-full items-center justify-center text-sh-text-dim font-mono text-[9px] uppercase tracking-widest text-center px-4 leading-normal">
                      No mapped activity
                    </div>
                  ) : (
                    tactic.techniques.map((tech) => {
                      let maxSevStr = "LOW";
                      if (tech.alerts.some((a) => a.severity === "CRITICAL"))
                        maxSevStr = "CRITICAL";
                      else if (tech.alerts.some((a) => a.severity === "HIGH"))
                        maxSevStr = "HIGH";
                      else if (tech.alerts.some((a) => a.severity === "MEDIUM"))
                        maxSevStr = "MEDIUM";

                      const bgClass = SEV_BG[maxSevStr];
                      const txtClass = SEV_TEXT[maxSevStr];

                      return (
                        <div
                          key={tech.id}
                          className={`p-2 rounded-lg border ${bgClass} shadow-sm relative overflow-hidden group`}
                        >
                          <div
                            className={`absolute top-0 left-0 w-1 h-full ${bgClass.split(" ")[0].replace("/15", "")}`}
                          ></div>

                          <div className="pl-3">
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-mono font-bold ${txtClass} uppercase`}
                              >
                                {tech.id}
                              </span>
                              <span
                                className={`text-[9px] font-mono bg-sh-surface px-1 py-0.5 rounded ${txtClass} border border-sh-border flex items-center gap-1`}
                              >
                                <AlertTriangle size={8} />
                                {tech.hits}
                              </span>
                            </div>

                            <div className="text-xs text-sh-text font-semibold mb-2 leading-tight">
                              {tech.name}
                            </div>

                            {/* Alert Context Pills */}
                            <div className="flex flex-col gap-1 mt-2">
                              {tech.alerts.slice(0, 2).map((a, i) => (
                                <div
                                  key={i}
                                  className="text-[9px] font-mono bg-sh-surface border border-sh-border rounded p-1 truncate text-sh-text-muted"
                                >
                                  <span className={SEV_TEXT[a.severity]}>
                                    {a.severity.charAt(0)}
                                  </span>{" "}
                                  | {a.source}
                                </div>
                              ))}
                              {tech.alerts.length > 2 && (
                                <div className="text-[8px] font-mono text-sh-text-dim pl-1 uppercase tracking-widest pt-0.5">
                                  + {tech.alerts.length - 2} more events
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MitreMatrix;
