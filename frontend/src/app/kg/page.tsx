"use client";
import React, { useState, useEffect } from "react";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { GraphData, GraphNode } from "@/types/graphTypes";

export default function KGPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/blocks.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch blocks.json");
        return res.json();
      })
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex w-screen h-screen">
      {/* Sidebar */}
      <div className="w-80 text-white p-6 box-border border-r border-zinc-800">
        <h2 className="text-xl mb-4 font-semibold">Node Details</h2>
        {selectedNode ? (
          <>
            <div className="font-semibold text-lg mb-2">{selectedNode.label || selectedNode.id}</div>
            <div className="text-sm text-zinc-300 mb-4">
              Group: {selectedNode.group || "(none)"}
            </div>
            <div className="text-base leading-relaxed">
              {selectedNode.description || "No content available for this node."}
            </div>
          </>
        ) : (
          <div className="text-zinc-400">Click a node to see its details here.</div>
        )}
      </div>
      {/* Graph Area */}
      <div className="flex-1 min-w-0 h-screen">
        {loading && <div className="text-white p-8">Loading graph...</div>}
        {error && <div className="text-red-400 p-8">{error}</div>}
        {graphData && (
          <KnowledgeGraph
            data={graphData}
            onNodeClick={setSelectedNode}
          />
        )}
      </div>
    </div>
  );
} 