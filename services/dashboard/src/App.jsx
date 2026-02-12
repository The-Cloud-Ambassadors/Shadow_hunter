import React, { useState, useEffect } from "react";
import GraphView from "./GraphView";
import Alerts from "./Alerts";
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
} from "lucide-react";

function App() {
  const [time, setTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen bg-sh-bg text-slate-200 font-sans flex overflow-hidden selection:bg-red-500/30">
      {/* 1. Sidebar (Slim Command Context) */}
      <aside className="w-16 flex-none bg-sh-panel border-r border-sh-border flex flex-col items-center py-4 gap-6 z-30">
        <div className="w-10 h-10 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <Shield className="w-6 h-6" />
        </div>

        <nav className="flex flex-col gap-4 w-full px-2">
          <NavItem icon={<LayoutDashboard />} active />
          <NavItem icon={<Network />} />
          <NavItem icon={<Bell />} badge="3" />
          <NavItem icon={<Settings />} />
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
        </div>
      </aside>

      {/* 2. Main Layout */}
      <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-sh-bg to-sh-bg">
        {/* Header (Command Bar) */}
        <header className="h-16 flex-none border-b border-sh-border flex items-center justify-between px-6 bg-sh-bg/50 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-widest text-white font-mono">
              SHADOW<span className="text-red-500">HUNTER</span>
              <span className="text-[10px] ml-2 text-slate-500 px-1.5 py-0.5 border border-slate-700 rounded bg-slate-900">
                v2.0.0
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="SEARCH_LOGS..."
                className="bg-sh-panel border border-sh-border rounded-full py-1.5 pl-9 pr-4 text-xs font-mono w-64 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-300 placeholder:text-slate-600"
              />
            </div>

            {/* Clock Widget */}
            <div className="text-right border-l border-sh-border pl-6">
              <div className="text-2xl font-mono font-light leading-none tracking-tight text-slate-300">
                {time.toLocaleTimeString([], { hour12: false })}
              </div>
              <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                UTC / ZULU
              </div>
            </div>
          </div>
        </header>

        {/* Content Stage */}
        <main className="flex-1 flex p-4 gap-4 overflow-hidden relative">
          {/* Background Grid Decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none"></div>

          {/* Left: Interactive Graph */}
          <div className="flex-1 h-full min-w-0 relative bg-sh-panel/30 border border-sh-border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm group">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-slate-700 rounded-tl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-slate-700 rounded-br-xl"></div>

            <GraphView />

            {/* Stats Ribbon (Floating) */}
            <div className="absolute top-4 left-4 right-4 flex gap-4 pointer-events-none">
              <StatCard
                label="NET_FLOW"
                value="1.2 GB/s"
                icon={<Activity className="text-blue-400" />}
              />
              <StatCard
                label="THREATS"
                value="3 DETECTED"
                icon={<Lock className="text-red-400" />}
                borderColor="border-red-500/30"
              />
            </div>
          </div>

          {/* Right: Intel Feed */}
          <div className="w-[380px] flex-none flex flex-col gap-4">
            <Alerts />
          </div>
        </main>
      </div>
    </div>
  );
}

// Sub-components for clean code
const NavItem = ({ icon, active, badge }) => (
  <button
    className={`w-full aspect-square flex items-center justify-center rounded-xl transition-all relative ${
      active
        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
        : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
    }`}
  >
    {React.cloneElement(icon, { size: 20 })}
    {badge && (
      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-sh-panel"></span>
    )}
  </button>
);

const StatCard = ({ label, value, icon, borderColor = "border-sh-border" }) => (
  <div
    className={`bg-sh-bg/80 backdrop-blur-md border ${borderColor} rounded-lg p-3 flex items-center gap-3 shadow-lg min-w-[160px]`}
  >
    <div className="p-2 bg-slate-900 rounded-md">
      {React.cloneElement(icon, { size: 16 })}
    </div>
    <div>
      <div className="text-[10px] text-slate-500 font-bold tracking-wider">
        {label}
      </div>
      <div className="text-sm font-mono font-bold text-slate-200">{value}</div>
    </div>
  </div>
);

export default App;
