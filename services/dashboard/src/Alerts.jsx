import React, { useEffect, useState } from "react";
import { fetchAlerts } from "./api";
import { AlertCircle, ShieldAlert } from "lucide-react";

const Alerts = () => {
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

  return (
    <div className="bg-sh-panel rounded-lg border border-slate-700 h-full flex flex-col shadow-xl">
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <ShieldAlert className="text-sh-accent w-5 h-5" />
        <h2 className="font-semibold text-slate-100">Security Alerts</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="text-slate-500 text-sm text-center mt-10">
            No active alerts
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-800/50 p-3 rounded border-l-4 border-red-500 hover:bg-slate-800 transition-colors"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-red-400 font-bold text-xs uppercase tracking-wider">
                  {alert.severity}
                </span>
                <span className="text-slate-500 text-xs">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-slate-200">{alert.description}</p>
              {alert.source && alert.target && (
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <span className="bg-slate-900 px-1 rounded">
                    {alert.source}
                  </span>
                  <span>→</span>
                  <span className="bg-slate-900 px-1 rounded">
                    {alert.target}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
