"use client";

import { useState, useEffect } from "react";
import { AgentMention } from "@/types/agentMentionTypes";

export function useAgents() {
  const [agents, setAgents] = useState<AgentMention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Primary: fetch from sync engine (subgraph-backed)
        const res = await fetch("/api/network/agents");
        if (res.ok) {
          const data = await res.json();
          const networkAgents: AgentMention[] = (data.agents || data.agents || []).map(
            (agent: any) => ({
              type: "agent" as const,
              id: agent.id || agent.agentId,
              name: agent.name,
              description: agent.description,
              systemPrompt: agent.systemPrompt || "",
              reputationScore: agent.reputationScore,
            })
          );

          // Merge with custom agents from localStorage
          let customAgents: AgentMention[] = [];
          if (typeof window !== "undefined") {
            try {
              const stored = localStorage.getItem("customAgents");
              if (stored) {
                customAgents = JSON.parse(stored).map((a: any) => ({
                  type: "agent" as const,
                  id: a.id,
                  name: a.name,
                  description: a.description,
                  systemPrompt: a.systemPrompt || "",
                }));
              }
            } catch {
              // ignore parse errors
            }
          }

          setAgents([...networkAgents, ...customAgents]);
          return;
        }
      } catch {
        // fall through to static fallback
      }

      // Fallback: static JSON (used if API/subgraph is unavailable)
      try {
        const { default: agentsData } = await import("@/app/agents.json");
        const staticAgents: AgentMention[] = (agentsData.agents as any[]).map((agent) => ({
          type: "agent" as const,
          id: agent.id,
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt || "",
        }));
        setAgents(staticAgents);
      } catch {
        console.error("Failed to load agents from any source");
      }
    };

    loadAgents().finally(() => setLoading(false));

    const handleStorageChange = () => loadAgents().finally(() => setLoading(false));
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, []);

  return { agents, loading };
}
