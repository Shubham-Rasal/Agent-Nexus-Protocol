"use client";

import { useQuery } from "@tanstack/react-query";
import { AgentMention } from "@/types/agentMentionTypes";

async function fetchAgents(): Promise<AgentMention[]> {
  try {
    const res = await fetch("/api/agents");
    if (res.ok) {
      const data = await res.json();
      const networkAgents: AgentMention[] = (data.agents ?? []).map((agent: any) => ({
        type: "agent" as const,
        id: agent.id || agent.agentId,
        name: agent.name,
        description: agent.description,
        systemPrompt: agent.systemPrompt || "",
        agentURI: agent.agentURI || "",
        tools: agent.tools || [],
        knowledge_sources: agent.knowledge_sources || [],
      }));

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
          // ignore
        }
      }

      return [...networkAgents, ...customAgents];
    }
  } catch {
    // fall through
  }

  // Static fallback
  try {
    const { default: agentsData } = await import("@/app/agents.json");
    return (agentsData.agents as any[]).map((agent) => ({
      type: "agent" as const,
      id: agent.id,
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt || "",
    }));
  } catch {
    return [];
  }
}

export function useAgents(enabled = true) {
  const { data: agents = [], isLoading: loading } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  });

  return { agents, loading };
}
