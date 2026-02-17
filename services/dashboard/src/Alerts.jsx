import React, { useEffect, useState } from "react";
import { fetchAlerts } from "./api";
import {
  AlertTriangle,
  ShieldAlert,
  XCircle,
  ArrowRight,
  Download,
} from "lucide-react";

const Alerts = ({ searchQuery, onExport }) => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadAlerts = async () => {
      const data = await fetchAlerts();
      setAlerts(data);
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.description?.toLowerCase().includes(q) ||
      a.source?.toLowerCase().includes(q) ||
      a.target?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col bg-sh-panel rounded-2xl border border-sh-border shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-sh-border bg-slate-900/50 backdrop-blur flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="font-bold text-sm tracking-wider text-slate-200 uppercase">
            Intel Feed
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExport(filtered)}
            className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
          >
            <Download size={10} />
            CSV
          </button>
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
          filtered.map((alert) => (
            <div
              key={alert.id}
              className="group relative bg-slate-900/80 hover:bg-slate-800 p-3 rounded-lg border border-sh-border hover:border-slate-600 transition-all cursor-pointer"
            >
              {/* Severity Stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                  alert.severity === "HIGH"
                    ? "bg-red-500 shadow-[0_0_10px_#ef4444]"
                    : "bg-amber-500"
                }`}
              ></div>

              <div className="pl-3">
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      alert.severity === "HIGH"
                        ? "bg-red-950/50 text-red-500 border-red-500/30"
                        : "bg-amber-950/50 text-amber-500 border-amber-500/30"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(alert.timestamp).toLocaleTimeString([], {
                      hour12: false,
                    })}
                  </span>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
