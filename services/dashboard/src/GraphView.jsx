import React, { useEffect, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { fetchGraphData } from "./api";

const GraphView = () => {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const loadGraph = async () => {
      const { nodes, edges } = await fetchGraphData();
      setElements([...nodes, ...edges]);
    };

    loadGraph();
    const interval = setInterval(loadGraph, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const layout = {
    name: "cose",
    animate: false,
    nodeDimensionsIncludeLabels: true,
  };

  const style = [
    {
      selector: "node",
      style: {
        "background-color": "#1e293b",
        label: "data(label)",
        color: "#94a3b8",
        "font-size": "10px",
        "font-family": "monospace",
        "text-valign": "bottom",
        "text-margin-y": 6,
        width: "40px",
        height: "40px",
        "border-width": 1,
        "border-color": "#334155",
        "overlay-opacity": 0,
      },
    },
    {
      selector: 'node[type="internal"]',
      style: {
        "background-color": "#0ea5e9", // Sky blue
        "border-color": "#bae6fd",
        "border-width": 1,
        width: "50px",
        height: "50px",
        shape: "rectangle",
      },
    },
    {
      selector: 'node[type="shadow"]',
      style: {
        "background-color": "#450a0a", // Dark Red
        "border-color": "#ef4444", // Bright Red
        "border-width": 2,
        shape: "hexagon",
        width: "60px",
        height: "60px",
        color: "#fca5a5",
        "shadow-blur": 10,
        "shadow-color": "#ef4444",
        "shadow-opacity": 0.5,
      },
    },
    {
      selector: 'node[type="external"]',
      style: {
        "background-color": "#064e3b", // Dark Emerald
        "border-color": "#10b981", // Bright Emerald
        width: "40px",
        height: "40px",
        shape: "ellipse",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "line-color": "#334155",
        "target-arrow-color": "#334155",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "arrow-scale": 0.8,
      },
    },
    {
      selector: 'edge[protocol="HTTPS"]',
      style: {
        "line-color": "#475569",
        "target-arrow-color": "#475569",
      },
    },
    {
      selector: 'edge[protocol="DNS"]',
      style: {
        "line-style": "dashed",
        "line-dash-pattern": [4, 4],
      },
    },
  ];

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg border border-slate-800 overflow-hidden relative">
      <div className="absolute top-2 left-2 z-10 text-[10px] font-mono text-slate-600">
        GRAPH_VISUALIZATION_V2
      </div>
      <CytoscapeComponent
        elements={elements}
        style={{ width: "100%", height: "100%" }}
        stylesheet={style}
        layout={layout}
        cy={(cy) => {
          // Optional: Auto-fit only on first load or significant change
          if (elements.length > 0 && elements.length < 5) cy.fit();
        }}
      />
    </div>
  );
};

export default GraphView;
