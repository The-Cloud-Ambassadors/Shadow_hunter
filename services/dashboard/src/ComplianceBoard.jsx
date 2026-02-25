import React, { useState, useEffect } from "react";
import { fetchCompliance } from "./api";
import {
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

const STATUS_STYLES = {
  pass: {
    icon: <CheckCircle size={14} />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    label: "PASS",
  },
  warn: {
    icon: <AlertTriangle size={14} />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    label: "WARN",
  },
  fail: {
    icon: <XCircle size={14} />,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "FAIL",
  },
};

const ComplianceBoard = () => {
  const [data, setData] = useState({
    frameworks: [],
    overall_compliance_score: 0,
    summary: {},
  });
  const [expandedFw, setExpandedFw] = useState(null);

  useEffect(() => {
    const load = async () => {
      const result = await fetchCompliance();
      if (result) setData(result);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const { frameworks, overall_compliance_score, summary } = data;
  const scoreColor =
    overall_compliance_score >= 80
      ? "text-emerald-400"
      : overall_compliance_score >= 60
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="h-full overflow-y-auto space-y-4 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
          Enterprise Compliance Posture
        </span>
      </div>

      {/* Overall Score Gauge */}
      <div className="bg-sh-panel border border-sh-border rounded-xl p-5 text-center">
        <div className="relative w-28 h-28 mx-auto mb-3">
          {/* SVG Gauge */}
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="currentColor"
              className="text-slate-800"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="currentColor"
              className={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(overall_compliance_score || 0) * 3.14} 314`}
              style={{
                transition: "stroke-dasharray 1s ease-out",
                filter: `drop-shadow(0 0 6px currentColor)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-mono font-bold ${scoreColor}`}>
              {overall_compliance_score || 0}%
            </span>
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
              Health Score
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-4 text-[10px] font-mono">
          <span className="text-slate-500">
            <span className="text-blue-400 font-bold">
              {summary.total_threats_intercepted || 0}
            </span>{" "}
            threats intercepted
          </span>
          <span className="text-slate-500">
            <span className="text-amber-400 font-bold">
              {summary.shadow_ai_nodes_detected || 0}
            </span>{" "}
            shadow nodes
          </span>
        </div>
      </div>

      {/* Framework Cards */}
      <div className="space-y-2">
        {frameworks.map((fw) => {
          const isExpanded = expandedFw === fw.id;
          const fwScoreColor =
            fw.health_score >= 80
              ? "text-emerald-400"
              : fw.health_score >= 60
                ? "text-amber-400"
                : "text-red-400";

          return (
            <div
              key={fw.id}
              className={`bg-sh-panel border rounded-xl overflow-hidden transition-all ${
                isExpanded
                  ? "border-emerald-500/30"
                  : "border-sh-border hover:border-slate-600"
              }`}
            >
              <div
                className="p-3 cursor-pointer flex items-center gap-3"
                onClick={() => setExpandedFw(isExpanded ? null : fw.id)}
              >
                {/* Score mini-gauge */}
                <div className="relative w-10 h-10 flex-none">
                  <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-800"
                      strokeWidth="3"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      className={fwScoreColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(fw.health_score / 100) * 100} 100`}
                    />
                  </svg>
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold ${fwScoreColor}`}
                  >
                    {fw.health_score}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {fw.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {fw.description}
                  </div>
                </div>

                {/* Status counts */}
                <div className="flex gap-1.5 flex-col text-right">
                  <span className="text-[9px] font-mono text-slate-400">
                    Controls Covered:{" "}
                    <span className="font-bold text-white">
                      {fw.controls_active}/{fw.controls_total}
                    </span>
                  </span>
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded inline-block w-max ml-auto">
                    {fw.threats_intercepted} Actions
                  </span>
                </div>

                <ChevronRight
                  size={14}
                  className={`text-slate-600 transition-transform flex-none ${isExpanded ? "rotate-90" : ""}`}
                />
              </div>

              {/* Expanded Checks - Now enterprise controls */}
              {isExpanded && (
                <div className="border-t border-sh-border/50 p-2 space-y-1 bg-slate-900/30">
                  {fw.controls.map((ctrl, i) => {
                    const st = ctrl.active
                      ? STATUS_STYLES.pass
                      : STATUS_STYLES.fail;
                    return (
                      <div
                        key={i}
                        className={`flex flex-col gap-1 px-2.5 py-2 rounded-lg ${st.bg} border ${st.border}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={st.color}>{st.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-mono font-bold text-slate-300">
                              {fw.id}:{ctrl.id}
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {ctrl.description}
                            </div>
                          </div>
                          <span
                            className={`text-[8px] font-mono font-bold ${st.color}`}
                          >
                            {ctrl.active ? "COVERED" : "UNMITIGATED"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplianceBoard;
