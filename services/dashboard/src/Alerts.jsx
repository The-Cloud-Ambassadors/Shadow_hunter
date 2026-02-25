import React, { useEffect, useState } from "react";
import { fetchAlerts, quarantineNode } from "./api";
import {
  AlertTriangle,
  ShieldAlert,
  XCircle,
  ArrowRight,
  Download,
  X,
  Clock,
  Cpu,
  Network,
  Activity,
  Shield,
  ChevronRight,
  Crosshair,
  Zap,
  ExternalLink,
  Lock,
} from "lucide-react";

const Alerts = ({ searchQuery, onExport, onNavigateToNode }) => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Copilot State
  const [copilotText, setCopilotText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeCopilotAlertId, setActiveCopilotAlertId] = useState(null);

  useEffect(() => {
    const loadAlerts = async () => {
      const data = await fetchAlerts();
      setAlerts(data);
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuarantine = async (e, ip) => {
    e.stopPropagation();
    if (
      window.confirm(
        `⚠️ ACTIVE DEFENSE\n\nAre you sure you want to QUARANTINE node ${ip}?\nThis will trigger the kill-switch and isolate the node.`,
      )
    ) {
      const res = await quarantineNode(
        ip,
        "Manual quarantine from Alerts panel",
      );
      if (res) alert(`✅ Node ${ip} quarantined successfully.`);
    }
  };

  const filtered = alerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.description?.toLowerCase().includes(q) ||
      a.source?.toLowerCase().includes(q) ||
      a.target?.toLowerCase().includes(q)
    );
  });

  const severityConfig = {
    HIGH: {
      stripe: "bg-red-500 shadow-[0_0_10px_#ef4444]",
      badge: "bg-red-950/50 text-red-500 border-red-500/30",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
      dot: "bg-red-500",
    },
    MEDIUM: {
      stripe: "bg-amber-500",
      badge: "bg-amber-950/50 text-amber-500 border-amber-500/30",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      dot: "bg-amber-500",
    },
    LOW: {
      stripe: "bg-blue-500",
      badge: "bg-blue-950/50 text-blue-400 border-blue-500/30",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
      dot: "bg-blue-500",
    },
  };

  // Find related alerts for the selected alert
  const relatedAlerts = selectedAlert
    ? filtered.filter(
        (a) =>
          a.id !== selectedAlert.id &&
          (a.source === selectedAlert.source ||
            a.target === selectedAlert.target),
      )
    : [];

  return (
    <div className="h-full flex flex-col bg-sh-panel rounded-2xl border border-sh-border shadow-xl overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-sh-border bg-slate-900/50 backdrop-blur flex justify-between items-center flex-none">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="font-bold text-sm tracking-wider text-slate-200 uppercase">
            Intel Feed
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onExport && (
            <button
              onClick={() => onExport(filtered)}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
            >
              <Download size={10} />
              CSV
            </button>
          )}
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            LIVE
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
            <ShieldAlert className="w-12 h-12 mb-2 stroke-1" />
            <span className="text-xs font-mono uppercase tracking-widest">
              {searchQuery ? "No matches found" : "System Secure"}
            </span>
          </div>
        ) : (
          filtered.map((alert) => {
            const sev = severityConfig[alert.severity] || severityConfig.LOW;
            const isSelected = selectedAlert?.id === alert.id;

            return (
              <div
                key={alert.id}
                onClick={() => {
                  setSelectedAlert(isSelected ? null : alert);
                  if (!isSelected) {
                    setCopilotText("");
                    setIsAnalyzing(false);
                    setActiveCopilotAlertId(null);
                  }
                }}
                className={`group relative bg-slate-900/80 hover:bg-slate-800 p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? `border-slate-500 ${sev.glow}`
                    : "border-sh-border hover:border-slate-600"
                }`}
              >
                {/* Severity Stripe */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${sev.stripe}`}
                ></div>

                <div className="pl-3">
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sev.badge}`}
                    >
                      {alert.severity}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour12: false,
                        })}
                      </span>
                      <ChevronRight
                        size={12}
                        className={`text-slate-600 transition-transform ${isSelected ? "rotate-90" : "group-hover:translate-x-0.5"}`}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-medium leading-relaxed mb-2">
                    {alert.description}
                  </div>

                  {alert.source && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
                      <span className="text-blue-400">{alert.source}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-red-400">{alert.target}</span>
                    </div>
                  )}
                </div>

                {/* ═══ Expanded Drill-Down Panel ═══ */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-sh-border/50 pl-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Packet Metadata */}
                    <DetailSection
                      icon={<Network size={11} />}
                      title="Packet Metadata"
                    >
                      <div className="grid grid-cols-2 gap-1.5">
                        <MetaField
                          label="Protocol"
                          value={alert.protocol || "—"}
                        />
                        <MetaField
                          label="Dst Port"
                          value={alert.destination_port || "—"}
                        />
                        <MetaField
                          label="Src Port"
                          value={alert.source_port || "—"}
                        />
                        <MetaField
                          label="Dst IP"
                          value={alert.destination_ip || "—"}
                        />
                        <MetaField
                          label="Bytes Sent"
                          value={
                            alert.bytes_sent != null
                              ? formatBytes(alert.bytes_sent)
                              : "—"
                          }
                        />
                        <MetaField
                          label="Bytes Recv"
                          value={
                            alert.bytes_received != null
                              ? formatBytes(alert.bytes_received)
                              : "—"
                          }
                        />
                      </div>
                    </DetailSection>

                    {/* Matched Rule */}
                    <DetailSection
                      icon={<Crosshair size={11} />}
                      title="Detection"
                    >
                      <div className="text-[11px] font-mono text-slate-300 bg-slate-950/50 p-2 rounded border border-sh-border/30 leading-relaxed">
                        {alert.matched_rule || alert.description}
                      </div>
                    </DetailSection>

                    {/* ML Intelligence (conditional) */}
                    {alert.ml_classification && (
                      <DetailSection
                        icon={<Cpu size={11} />}
                        title="ML Intelligence"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-500">
                              Classification
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                alert.ml_classification === "shadow_ai"
                                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : alert.ml_classification === "suspicious"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              }`}
                            >
                              {alert.ml_classification
                                .replace("_", " ")
                                .toUpperCase()}
                            </span>
                          </div>

                          {/* Confidence Bar */}
                          {alert.ml_confidence != null && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono text-slate-500">
                                  Confidence
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-300">
                                  {(alert.ml_confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    alert.ml_confidence > 0.7
                                      ? "bg-red-500"
                                      : alert.ml_confidence > 0.4
                                        ? "bg-amber-500"
                                        : "bg-blue-500"
                                  }`}
                                  style={{
                                    width: `${(alert.ml_confidence * 100).toFixed(0)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {alert.ml_risk_score != null && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-500">
                                Risk Score
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  alert.ml_risk_score > 70
                                    ? "text-red-400"
                                    : alert.ml_risk_score > 40
                                      ? "text-amber-400"
                                      : "text-blue-400"
                                }`}
                              >
                                {typeof alert.ml_risk_score === "number"
                                  ? alert.ml_risk_score.toFixed(1)
                                  : alert.ml_risk_score}
                              </span>
                            </div>
                          )}
                        </div>
                      </DetailSection>
                    )}

                    {/* SHAP Explainability Section */}
                    {(() => {
                      const desc = alert.description || "";
                      if (desc.includes("Top Factors:")) {
                        const parts = desc.split("Top Factors:");
                        const factors = parts[1]
                          .split(",")
                          .map((f) => f.trim());

                        return (
                          <DetailSection
                            icon={<Zap size={11} className="text-yellow-400" />}
                            title="AI Explainability (SHAP)"
                          >
                            <div className="mb-2 text-[11px] text-slate-400 italic">
                              "Why did the model flag this?"
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {factors.map((factor, i) => {
                                // Extract sign for color
                                const isPositive = factor.includes("(+");
                                return (
                                  <div
                                    key={i}
                                    className={`text-[10px] font-mono px-2 py-1 rounded border ${isPositive ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-blue-500/10 border-blue-500/30 text-blue-400"}`}
                                  >
                                    {factor}
                                  </div>
                                );
                              })}
                            </div>
                          </DetailSection>
                        );
                      }
                      return null;
                    })()}

                    {/* Timestamp Details */}
                    <DetailSection icon={<Clock size={11} />} title="Timestamp">
                      <div className="text-[11px] font-mono text-slate-400">
                        {new Date(alert.timestamp).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </div>
                      <div className="text-[9px] font-mono text-slate-600 mt-0.5">
                        ID: {alert.id}
                      </div>
                    </DetailSection>

                    {/* AI Copilot Streaming View - Moved up for visibility */}
                    {(activeCopilotAlertId === alert.id || (copilotText && activeCopilotAlertId === alert.id)) && (
                      <div className="p-3 bg-slate-950/90 border border-purple-500/40 rounded-xl relative overflow-hidden group shadow-lg shadow-purple-900/10 my-2">
                        <div className="absolute inset-0 bg-linear-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                        <div className="flex items-center gap-2 mb-3 border-b border-purple-500/30 pb-2 relative">
                          <Zap size={13} className="text-purple-400" />
                          <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-widest text-shadow-sm">
                            Hunter AI Investigation
                          </span>
                          {isAnalyzing && (
                            <span className="flex h-2 w-2 relative ml-auto mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar pr-2 relative z-10 selection:bg-purple-500/30">
                          <SimpleMarkdown
                            text={copilotText}
                            isTyping={isAnalyzing}
                          />
                        </div>
                      </div>
                    )}

                    {/* Navigation and Defense */}
                    {onNavigateToNode && (
                      <DetailSection
                        icon={<ExternalLink size={11} />}
                        title="Actions & Navigation"
                      >
                        <div className="flex flex-col gap-2">
                          {/* Copilot Action */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (isAnalyzing) return;
                              
                              if (activeCopilotAlertId === alert.id && copilotText !== "") {
                                // Already analyzed, let them click again to re-analyze by resetting
                                setCopilotText("");
                              }

                              setIsAnalyzing(true);
                              setActiveCopilotAlertId(alert.id);
                              setCopilotText("");

                              try {
                                const res = await fetch(
                                  "http://localhost:8000/v1/copilot/analyze",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      "X-API-Key": "shadow-hunter-dev",
                                    },
                                    body: JSON.stringify({
                                      alert_id: alert.id,
                                    }),
                                  },
                                );

                                if (!res.ok) {
                                  let errDetail = "Failed to connect to AI Engine.";
                                  try {
                                    const errJson = await res.json();
                                    if (errJson.detail) errDetail = errJson.detail;
                                  } catch (parseError) {
                                    console.warn("Could not parse backend error details:", parseError);
                                  }
                                  setCopilotText(`⚠️ Backend Error: ${errDetail}`);
                                  return;
                                }

                                const reader = res.body.getReader();
                                const decoder = new TextDecoder();

                                while (true) {
                                  const { value, done } = await reader.read();
                                  if (done) break;
                                  const chunk = decoder.decode(value, {
                                    stream: true,
                                  });
                                  setCopilotText((prev) => prev + chunk);
                                }
                              } catch (error) {
                                console.error(
                                  "Copilot streaming failed:",
                                  error,
                                );
                                setCopilotText(
                                  "⚠️ Connection to Hunter AI failed. Please try again.",
                                );
                              } finally {
                                setIsAnalyzing(false);
                              }
                            }}
                            disabled={
                              isAnalyzing && activeCopilotAlertId === alert.id
                            }
                            className={`w-full flex items-center justify-center gap-2 text-[10px] font-mono font-bold rounded-lg py-2 px-2 transition-all uppercase tracking-widest ${
                              isAnalyzing && activeCopilotAlertId === alert.id
                                ? "text-purple-400 bg-purple-500/10 border border-purple-500/30 opacity-70"
                                : "text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] glow"
                            }`}
                          >
                            <Zap
                              size={12}
                              className={
                                isAnalyzing && activeCopilotAlertId === alert.id
                                  ? "animate-pulse"
                                  : ""
                              }
                            />
                            {isAnalyzing && activeCopilotAlertId === alert.id
                              ? "Analyzing Incident..."
                              : "✨ Copilot Analyze"}
                          </button>

                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToNode(alert.source);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg py-1.5 px-2 transition-all"
                            >
                              <Zap size={10} />
                              View Source
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToNode(alert.target);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg py-1.5 px-2 transition-all"
                            >
                              <Crosshair size={10} />
                              View Target
                            </button>
                          </div>

                          {/* Kill Switch Button */}
                          <button
                            onClick={(e) => handleQuarantine(e, alert.source)}
                            className="w-full flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg py-2 px-2 transition-all uppercase tracking-widest mt-1"
                          >
                            <Lock size={12} className="animate-pulse" />
                            Quarantine Source Node
                          </button>
                        </div>
                      </DetailSection>
                    )}

                    {/* Related Events */}
                    {relatedAlerts.length > 0 && (
                      <DetailSection
                        icon={<Activity size={11} />}
                        title={`Related Events (${relatedAlerts.length})`}
                      >
                        <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                          {relatedAlerts.slice(0, 5).map((ra) => (
                            <div
                              key={ra.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlert(ra);
                              }}
                              className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/50 border border-sh-border/30 rounded px-2 py-1 hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full flex-none ${severityConfig[ra.severity]?.dot || "bg-slate-500"}`}
                              />
                              <span className="truncate flex-1">
                                {ra.description}
                              </span>
                              <span className="text-slate-600 flex-none">
                                {new Date(ra.timestamp).toLocaleTimeString([], {
                                  hour12: false,
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </DetailSection>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════

const DetailSection = ({ icon, title, children }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-slate-500">{icon}</span>
      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
        {title}
      </span>
    </div>
    {children}
  </div>
);

const MetaField = ({ label, value }) => (
  <div className="bg-slate-950/50 border border-sh-border/30 rounded px-2 py-1">
    <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
      {label}
    </div>
    <div className="text-[11px] font-mono text-slate-300 truncate">{value}</div>
  </div>
);

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Extremely lightweight markdown renderer for the Copilot feature
const SimpleMarkdown = ({ text, isTyping }) => {
  if (!text) return null;

  // Basic line-by-line parsing for bold, code, and headers
  const renderLine = (line, i) => {
    if (line.startsWith("### ")) {
      return (
        <h3 key={i} className="text-xs font-bold text-purple-300 mt-3 mb-1">
          {line.replace("### ", "")}
        </h3>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h1
          key={i}
          className="text-sm font-bold text-white mb-2 pb-1 border-b border-slate-700/50"
        >
          {line.replace("# ", "")}
        </h1>
      );
    }
    if (line === "---") {
      return <hr key={i} className="border-slate-700/50 my-2" />;
    }

    // Parse bold **text** and code `text`
    let formatted = line;
    formatted = formatted.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-slate-100">$1</strong>',
    );
    formatted = formatted.replace(
      /\*(.*?)\*/g,
      '<em class="text-slate-400">$1</em>',
    );
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="bg-black/50 text-purple-200 px-1 py-0.5 rounded border border-purple-500/20">$1</code>',
    );

    const isListItem = line.startsWith("- ");
    const content = isListItem ? formatted.substring(2) : formatted;

    return isListItem ? (
      <li
        key={i}
        className="ml-4 list-disc marker:text-purple-500/50"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    ) : (
      <React.Fragment key={i}>
        <span dangerouslySetInnerHTML={{ __html: content }} />
        <br />
      </React.Fragment>
    );
  };

  const lines = text.split("\n");

  return (
    <div>
      {lines.map((l, i) => renderLine(l, i))}
      {isTyping && (
        <span className="inline-block w-1.5 h-3 bg-purple-500/50 animate-pulse ml-1 align-middle"></span>
      )}
    </div>
  );
};

export default Alerts;
