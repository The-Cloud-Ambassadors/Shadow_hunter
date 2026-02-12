import React, { useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import { fetchGraphData } from "./api";

const STYLESHEET = [
  // ─── Base Node ───
  {
    selector: "node",
    style: {
      "background-color": "#1e293b",
      label: "data(label)",
      color: "#94a3b8",
      "font-size": "9px",
      "font-family": "'Courier New', monospace",
      "text-valign": "bottom",
      "text-margin-y": 8,
      width: 36,
      height: 36,
      "border-width": 1.5,
      "border-color": "#334155",
      "overlay-opacity": 0,
      "text-outline-width": 2,
      "text-outline-color": "#0f172a",
      "text-wrap": "ellipsis",
      "text-max-width": "80px",
    },
  },
  // ─── Internal (Blue Squares) ───
  {
    selector: 'node[type="internal"]',
    style: {
      "background-color": "#0c4a6e",
      "border-color": "#0ea5e9",
      "border-width": 2,
      width: 44,
      height: 44,
      shape: "round-rectangle",
      color: "#7dd3fc",
    },
  },
  // ─── Shadow AI (RED Hexagons) ───
  {
    selector: 'node[type="shadow"]',
    style: {
      "background-color": "#450a0a",
      "border-color": "#ef4444",
      "border-width": 2.5,
      shape: "hexagon",
      width: 56,
      height: 56,
      color: "#fca5a5",
      "font-weight": "bold",
      "font-size": "10px",
      "shadow-blur": 15,
      "shadow-color": "#ef4444",
      "shadow-opacity": 0.6,
    },
  },
  // ─── External (Green Circles) ───
  {
    selector: 'node[type="external"]',
    style: {
      "background-color": "#064e3b",
      "border-color": "#10b981",
      "border-width": 1.5,
      width: 36,
      height: 36,
      shape: "ellipse",
      color: "#6ee7b7",
    },
  },
  // ─── Edges ───
  {
    selector: "edge",
    style: {
      width: 1.5,
      "line-color": "#1e293b",
      "target-arrow-color": "#334155",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      "arrow-scale": 0.7,
      opacity: 0.5,
    },
  },
  {
    selector: 'edge[protocol="HTTPS"]',
    style: {
      "line-color": "#334155",
      "target-arrow-color": "#475569",
      width: 1.5,
    },
  },
  {
    selector: 'edge[protocol="TCP"]',
    style: {
      "line-color": "#1e3a5f",
      "target-arrow-color": "#1e3a5f",
      width: 1,
    },
  },
  {
    selector: 'edge[protocol="HTTP"]',
    style: {
      "line-color": "#374151",
      "target-arrow-color": "#374151",
      "line-style": "dashed",
      width: 1,
    },
  },
];

const GraphView = () => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const knownNodeIds = useRef(new Set());
  const knownEdgeIds = useRef(new Set());
  const initialLayoutDone = useRef(false);

  // Initialize Cytoscape once
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: STYLESHEET,
      layout: { name: "preset" }, // Start empty, no layout
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // Poll for data and incrementally add elements
  useEffect(() => {
    const loadGraph = async () => {
      const { nodes, edges } = await fetchGraphData();
      const cy = cyRef.current;
      if (!cy) return;

      let addedNew = false;

      // Add new nodes only
      for (const node of nodes) {
        const id = node.data.id;
        if (!knownNodeIds.current.has(id)) {
          knownNodeIds.current.add(id);
          // Position new nodes randomly in the viewport
          const w = containerRef.current?.offsetWidth || 800;
          const h = containerRef.current?.offsetHeight || 600;
          cy.add({
            group: "nodes",
            data: node.data,
            position: {
              x: 100 + Math.random() * (w - 200),
              y: 100 + Math.random() * (h - 200),
            },
          });
          addedNew = true;
        } else {
          // Update existing node data (e.g. last_seen)
          const existing = cy.getElementById(id);
          if (existing.length) {
            existing.data(node.data);
          }
        }
      }

      // Add new edges only
      for (const edge of edges) {
        const id = edge.data.id;
        if (!knownEdgeIds.current.has(id)) {
          knownEdgeIds.current.add(id);
          // Only add if both source and target exist
          if (
            cy.getElementById(edge.data.source).length &&
            cy.getElementById(edge.data.target).length
          ) {
            cy.add({ group: "edges", data: edge.data });
          }
        }
      }

      // Run layout ONCE after first batch of data arrives, then never again
      if (!initialLayoutDone.current && nodes.length > 3) {
        initialLayoutDone.current = true;
        const ly = cy.layout({
          name: "cose",
          animate: true,
          animationDuration: 800,
          nodeDimensionsIncludeLabels: true,
          padding: 60,
          nodeRepulsion: () => 8000,
          idealEdgeLength: () => 130,
          edgeElasticity: () => 100,
          gravity: 0.25,
          numIter: 300,
          randomize: false,
          componentSpacing: 100,
        });
        ly.run();
      }
    };

    loadGraph();
    const interval = setInterval(loadGraph, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Graph Label */}
      <div className="absolute top-2 left-2 z-10 text-[10px] font-mono text-slate-600 flex items-center gap-2">
        NETWORK_TOPOLOGY
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-green-500/50">LIVE</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-3 text-[9px] font-mono text-slate-500 bg-sh-bg/70 px-2 py-1 rounded backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-sky-700 border border-sky-500 inline-block"></span>
          Internal
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-900 border border-emerald-500 inline-block"></span>
          External
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-3 h-3 bg-red-950 border-2 border-red-500 inline-block"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          ></span>
          Shadow AI
        </div>
      </div>

      {/* Cytoscape Container */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default GraphView;
