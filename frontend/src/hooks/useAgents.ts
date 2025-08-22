"use client";

import { useState, useEffect } from 'react';
import { AgentMention } from '@/types/agentMentionTypes';
import agentsData from '@/app/agents.json';

export function useAgents() {
  const [agents, setAgents] = useState<AgentMention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgents = () => {
      try {
        // Load predefined agents from JSON
        const predefinedAgents = (agentsData.agents as any[]).map((agent) => ({
          type: 'agent' as const,
          id: agent.id,
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt || '',
        }));

        // Get custom agents from localStorage (if available)
        let customAgents: AgentMention[] = [];
        
        if (typeof window !== 'undefined') {
          try {
            const customAgentsJson = localStorage.getItem('customAgents');
            if (customAgentsJson) {
              const parsedCustomAgents = JSON.parse(customAgentsJson);
              customAgents = parsedCustomAgents.map((agent: any) => ({
                type: 'agent' as const,
                id: agent.id,
                name: agent.name,
                description: agent.description,
                systemPrompt: agent.systemPrompt || '',
              }));
            }
          } catch (error) {
            console.error('Error loading custom agents from localStorage:', error);
          }
        }

        // Combine both agent sources
        setAgents([...predefinedAgents, ...customAgents]);
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();

    // Set up event listener for storage changes (if another tab updates)
    const handleStorageChange = () => {
      loadAgents();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  return { agents, loading };
}