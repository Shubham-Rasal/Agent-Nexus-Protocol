/**
 * Agent Registry Service
 * 
 * Manages agent registration, discovery, and metadata
 */

import {
  AgentRegistry,
  AgentMetadata,
  AgentStatus,
  AgentFramework,
} from '@/types/agentCommunicationProtocol';

export class AgentRegistryService implements AgentRegistry {
  private agents: Map<string, AgentMetadata> = new Map();
  private capabilityIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  /**
   * Register a new agent
   */
  async register(agent: AgentMetadata): Promise<void> {
    // Validate agent metadata
    this.validateAgent(agent);

    // Store agent
    this.agents.set(agent.id, agent);

    // Index by capabilities
    agent.capabilities.forEach(capability => {
      if (!this.capabilityIndex.has(capability.id)) {
        this.capabilityIndex.set(capability.id, new Set());
      }
      this.capabilityIndex.get(capability.id)!.add(agent.id);
    });

    // Index by tags
    agent.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(agent.id);
    });

    console.log(`Agent registered: ${agent.id} (${agent.name})`);
  }

  /**
   * Unregister an agent
   */
  async unregister(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Remove from capability index
    agent.capabilities.forEach(capability => {
      const agentSet = this.capabilityIndex.get(capability.id);
      if (agentSet) {
        agentSet.delete(agentId);
        if (agentSet.size === 0) {
          this.capabilityIndex.delete(capability.id);
        }
      }
    });

    // Remove from tag index
    agent.tags.forEach(tag => {
      const agentSet = this.tagIndex.get(tag);
      if (agentSet) {
        agentSet.delete(agentId);
        if (agentSet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    // Remove agent
    this.agents.delete(agentId);

    console.log(`Agent unregistered: ${agentId}`);
  }

  /**
   * Find agents by capability
   */
  async findByCapability(capability: string): Promise<AgentMetadata[]> {
    const agentIds = this.capabilityIndex.get(capability);
    if (!agentIds || agentIds.size === 0) {
      return [];
    }

    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is AgentMetadata => agent !== undefined);
  }

  /**
   * Find agents by tag
   */
  async findByTag(tag: string): Promise<AgentMetadata[]> {
    const agentIds = this.tagIndex.get(tag);
    if (!agentIds || agentIds.size === 0) {
      return [];
    }

    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is AgentMetadata => agent !== undefined);
  }

  /**
   * Get agent metadata
   */
  async getAgent(agentId: string): Promise<AgentMetadata | null> {
    return this.agents.get(agentId) || null;
  }

  /**
   * List all registered agents
   */
  async listAgents(filter?: {
    status?: AgentStatus;
    framework?: AgentFramework;
    capability?: string;
  }): Promise<AgentMetadata[]> {
    let agents = Array.from(this.agents.values());

    if (filter) {
      if (filter.status) {
        agents = agents.filter(agent => agent.status === filter.status);
      }

      if (filter.framework) {
        agents = agents.filter(agent => agent.framework === filter.framework);
      }

      if (filter.capability) {
        const capabilityAgents = await this.findByCapability(filter.capability);
        const capabilityIds = new Set(capabilityAgents.map(a => a.id));
        agents = agents.filter(agent => capabilityIds.has(agent.id));
      }
    }

    return agents;
  }

  /**
   * Update agent status
   */
  async updateStatus(agentId: string, status: AgentStatus): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.status = status;
    if (agent.metrics) {
      agent.metrics.lastActiveTime = new Date();
    }
  }

  /**
   * Update agent metrics
   */
  async updateMetrics(
    agentId: string,
    update: {
      taskCompleted?: boolean;
      taskFailed?: boolean;
      responseTime?: number;
      qualityScore?: number;
    }
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (!agent.metrics) {
      agent.metrics = {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageResponseTime: 0,
        lastActiveTime: new Date(),
      };
    }

    if (update.taskCompleted) {
      agent.metrics.totalTasks++;
      agent.metrics.successfulTasks++;
    }

    if (update.taskFailed) {
      agent.metrics.totalTasks++;
      agent.metrics.failedTasks++;
    }

    if (update.responseTime !== undefined) {
      if (agent.metrics.totalTasks === 1) {
        // First task - set initial average
        agent.metrics.averageResponseTime = update.responseTime;
      } else {
        // Calculate running average
        const total = agent.metrics.averageResponseTime * (agent.metrics.totalTasks - 1);
        agent.metrics.averageResponseTime = (total + update.responseTime) / agent.metrics.totalTasks;
      }
    }

    if (update.qualityScore !== undefined) {
      agent.metrics.averageQualityScore = update.qualityScore;
    }

    agent.metrics.lastActiveTime = new Date();
  }

  /**
   * Search agents by query
   */
  async search(query: string): Promise<AgentMetadata[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.agents.values()).filter(agent => {
      // Search in name
      if (agent.name.toLowerCase().includes(queryLower)) return true;

      // Search in description
      if (agent.description.toLowerCase().includes(queryLower)) return true;

      // Search in tags
      if (agent.tags.some(tag => tag.toLowerCase().includes(queryLower))) return true;

      // Search in capabilities
      if (agent.capabilities.some(cap => 
        cap.name.toLowerCase().includes(queryLower) ||
        cap.description.toLowerCase().includes(queryLower)
      )) return true;

      return false;
    });
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalAgents: number;
    activeAgents: number;
    totalCapabilities: number;
    totalTags: number;
    frameworkDistribution: Record<string, number>;
  } {
    const agents = Array.from(this.agents.values());
    
    const frameworkDistribution: Record<string, number> = {};
    agents.forEach(agent => {
      frameworkDistribution[agent.framework] = (frameworkDistribution[agent.framework] || 0) + 1;
    });

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === AgentStatus.IDLE || a.status === AgentStatus.BUSY).length,
      totalCapabilities: this.capabilityIndex.size,
      totalTags: this.tagIndex.size,
      frameworkDistribution,
    };
  }

  /**
   * Validate agent metadata
   */
  private validateAgent(agent: AgentMetadata): void {
    if (!agent.id) throw new Error('Agent ID is required');
    if (!agent.name) throw new Error('Agent name is required');
    if (!agent.description) throw new Error('Agent description is required');
    if (!agent.framework) throw new Error('Agent framework is required');
    if (!agent.capabilities || agent.capabilities.length === 0) {
      throw new Error('Agent must have at least one capability');
    }
  }

  /**
   * Clear all agents (for testing)
   */
  clear(): void {
    this.agents.clear();
    this.capabilityIndex.clear();
    this.tagIndex.clear();
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistryService();
