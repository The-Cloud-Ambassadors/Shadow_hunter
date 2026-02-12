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
        color: "#f8fafc",
        "font-size": "12px",
        "text-valign": "center",
        "text-halign": "center",
        width: "120px",
        height: "40px",
        shape: "round-rectangle",
        "border-width": 2,
        "border-color": "#475569",
      },
    },
    {
      selector: 'node[type="internal"]',
      style: {
        "background-color": "#0ea5e9", // Sky blue
        "border-color": "#bae6fd",
      },
    },
    {
      selector: 'node[type="shadow"]',
      style: {
        "background-color": "#ef4444", // Red
        "border-color": "#fecaca",
        "border-style": "dashed",
      },
    },
    {
      selector: 'node[type="external"]',
      style: {
        "background-color": "#10b981", // Emerald
        "border-color": "#a7f3d0",
      },
    },
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": "#64748b",
        "target-arrow-color": "#64748b",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        label: "data(protocol)",
        "font-size": "10px",
        color: "#94a3b8",
        "text-rotation": "autorotate",
      },
    },
  ];

  return (
    <div className="w-full h-full bg-sh-dark rounded-lg border border-slate-700 overflow-hidden shadow-xl">
      <CytoscapeComponent
        elements={elements}
        style={{ width: "100%", height: "100%" }}
        stylesheet={style}
        layout={layout}
        cy={(cy) => {
          cy.fit();
        }}
      />
    </div>
  );
};

export default GraphView;
