"use client";

import { useState, useEffect } from 'react';
import { AgentMention } from '@/types/agentMentionTypes';
import agentsData from '@/app/agents.json';

// IndexedDB Service for reading agents (simplified version)
class AgentIndexedDBService {
  private dbName = 'AIAgentsDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('agents')) {
          const agentsStore = db.createObjectStore('agents', { keyPath: 'id' });
          agentsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async getAllAgents(): Promise<any[]> {
    if (!this.db) {
      await this.init();
    }
    
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['agents'], 'readonly');
      const store = transaction.objectStore('agents');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }
}

export function useAgents() {
  const [agents, setAgents] = useState<AgentMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbService] = useState(() => new AgentIndexedDBService());

  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Load predefined agents from JSON
        const predefinedAgents = (agentsData.agents as any[]).map((agent) => ({
          type: 'agent' as const,
          id: agent.id,
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt || '',
        }));

        // Load custom agents from localStorage (fallback)
        let customAgentsFromLocalStorage: AgentMention[] = [];
        if (typeof window !== 'undefined') {
          try {
            const customAgentsJson = localStorage.getItem('customAgents');
            if (customAgentsJson) {
              const parsedCustomAgents = JSON.parse(customAgentsJson);
              customAgentsFromLocalStorage = parsedCustomAgents.map((agent: any) => ({
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

        // Load custom agents from IndexedDB
        let customAgentsFromIndexedDB: AgentMention[] = [];
        if (dbService.isAvailable()) {
          try {
            const indexedDBAgents = await dbService.getAllAgents();
            customAgentsFromIndexedDB = indexedDBAgents.map((agent: any) => ({
              type: 'agent' as const,
              id: agent.id,
              name: agent.name,
              description: agent.description,
              systemPrompt: agent.systemPrompt || '',
            }));
            console.log(`Loaded ${customAgentsFromIndexedDB.length} agents from IndexedDB`);
          } catch (error) {
            console.error('Error loading custom agents from IndexedDB:', error);
            // Fallback to localStorage if IndexedDB fails
          }
        }

        // Combine all agent sources, prioritizing IndexedDB over localStorage
        // Remove duplicates based on ID (IndexedDB takes precedence)
        const allCustomAgents = [...customAgentsFromIndexedDB];
        
        // Add localStorage agents that don't exist in IndexedDB
        customAgentsFromLocalStorage.forEach(localAgent => {
          if (!allCustomAgents.find(dbAgent => dbAgent.id === localAgent.id)) {
            allCustomAgents.push(localAgent);
          }
        });

        // Combine predefined and custom agents
        const combinedAgents = [...predefinedAgents, ...allCustomAgents];
        
        console.log(`Total agents loaded: ${combinedAgents.length} (${predefinedAgents.length} predefined + ${allCustomAgents.length} custom)`);
        setAgents(combinedAgents);

      } catch (error) {
        console.error('Error loading agents:', error);
        // Fallback to just predefined agents
        const predefinedAgents = (agentsData.agents as any[]).map((agent) => ({
          type: 'agent' as const,
          id: agent.id,
          name: agent.name,
          description: agent.description,
          systemPrompt: agent.systemPrompt || '',
        }));
        setAgents(predefinedAgents);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();

    // Set up event listener for storage changes
    const handleStorageChange = () => {
      loadAgents();
    };

    // Set up custom event listener for IndexedDB changes
    const handleCustomAgentUpdate = () => {
      loadAgents();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('customAgentUpdated', handleCustomAgentUpdate);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('customAgentUpdated', handleCustomAgentUpdate);
      };
    }
  }, [dbService]);

  // Function to refresh agents (useful for manual refresh)
  const refreshAgents = () => {
    setLoading(true);
    // Trigger useEffect to reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('customAgentUpdated'));
    }
  };

  return { 
    agents, 
    loading,
    refreshAgents 
  };
}