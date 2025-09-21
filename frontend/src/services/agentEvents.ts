// utils/agentEvents.ts
"use client";

/**
 * Utility functions to handle agent update events
 * This helps keep the mention system synchronized with IndexedDB changes
 */

export class AgentEventDispatcher {
  /**
   * Dispatch an event when agents are updated in IndexedDB
   * This will trigger the useAgents hook to refresh
   */
  static dispatchAgentUpdate() {
    if (typeof window !== 'undefined') {
      console.log('🔄 Dispatching agent update event');
      window.dispatchEvent(new Event('customAgentUpdated'));
    }
  }

  /**
   * Dispatch specific events for different agent operations
   */
  static dispatchAgentCreated(agentId: string) {
    if (typeof window !== 'undefined') {
      console.log(`✨ Agent created: ${agentId}`);
      window.dispatchEvent(new CustomEvent('agentCreated', { detail: { agentId } }));
      this.dispatchAgentUpdate();
    }
  }

  static dispatchAgentDeleted(agentId: string) {
    if (typeof window !== 'undefined') {
      console.log(`🗑️ Agent deleted: ${agentId}`);
      window.dispatchEvent(new CustomEvent('agentDeleted', { detail: { agentId } }));
      this.dispatchAgentUpdate();
    }
  }

  static dispatchAgentUpdated(agentId: string) {
    if (typeof window !== 'undefined') {
      console.log(`📝 Agent updated: ${agentId}`);
      window.dispatchEvent(new CustomEvent('agentUpdated', { detail: { agentId } }));
      this.dispatchAgentUpdate();
    }
  }

  static dispatchAllDataCleared() {
    if (typeof window !== 'undefined') {
      console.log('🧹 All agent data cleared');
      window.dispatchEvent(new Event('allAgentsCleared'));
      this.dispatchAgentUpdate();
    }
  }
}