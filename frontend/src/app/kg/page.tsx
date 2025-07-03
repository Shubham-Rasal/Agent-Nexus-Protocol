"use client";
import React, { useState, useEffect } from "react";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { GraphData, GraphNode } from "@/types/graphTypes";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

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
    <SidebarProvider>
      <div className="flex w-screen h-screen bg-zinc-900">
        <Sidebar className="bg-zinc-800 text-white border-r border-zinc-800 w-1/2 max-w-lg min-w-[20rem]">
          <SidebarHeader>
            <h2 className="text-xl font-semibold">Node Details</h2>
          </SidebarHeader>
          <SidebarContent>
            {selectedNode ? (
              <SidebarGroup>
                <SidebarGroupLabel>
                  {selectedNode.label || selectedNode.id}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  {selectedNode.group && (
                    <div className="text-sm text-zinc-300 mb-2">
                      Group: {selectedNode.group}
                    </div>
                  )}
                  {selectedNode.user && (
                    <div className="text-sm text-zinc-300 mb-2">
                      User: {selectedNode.user}
                    </div>
                  )}
                  {selectedNode.description && (
                    <div className="text-base leading-relaxed mb-2">
                      {selectedNode.description}
                    </div>
                  )}
                  <div className="text-xs text-zinc-400 mt-4 overflow-x-auto">
                    <pre>{JSON.stringify(selectedNode, null, 2)}</pre>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : (
              <div className="text-zinc-400 p-4">Click a node to see its details here.</div>
            )}
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 min-w-0 h-screen w-full">
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
    </SidebarProvider>
  );
} 