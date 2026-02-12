import React from "react";
import GraphView from "./GraphView";
import Alerts from "./Alerts";
import { Activity, Shield } from "lucide-react";

function App() {
  return (
    <div className="h-screen w-screen bg-sh-dark flex flex-col text-slate-200">
      {/* Header */}
      <header className="h-16 border-b border-slate-700 flex items-center px-6 bg-sh-panel justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Shadow Hunter{" "}
            <span className="text-slate-400 font-normal text-sm ml-2">
              Enterprise
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-green-400">System Active</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex p-4 gap-4 overflow-hidden">
        {/* Left: Graph Visualization */}
        <div className="flex-1 h-full min-w-0">
          <GraphView />
        </div>

        {/* Right: Alerts & Stats */}
        <div className="w-96 h-full flex flex-col gap-4 min-w-0">
          {/* Stats Widget (Placeholder) */}
          <div className="h-32 bg-sh-panel rounded-lg border border-slate-700 p-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded p-3 flex flex-col justify-center items-center">
              <span className="text-2xl font-bold text-blue-400">12</span>
              <span className="text-xs text-slate-400 uppercase">
                Active APIs
              </span>
            </div>
            <div className="bg-slate-800/50 rounded p-3 flex flex-col justify-center items-center">
              <span className="text-2xl font-bold text-red-400">3</span>
              <span className="text-xs text-slate-400 uppercase">
                Shadow Items
              </span>
            </div>
          </div>

          {/* Alerts List */}
          <div className="flex-1 min-h-0">
            <Alerts />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
