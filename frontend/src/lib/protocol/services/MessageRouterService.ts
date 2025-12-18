/**
 * Message Router Service
 * 
 * Routes messages between agents and finds best agents for tasks
 */

import {
  MessageRouter,
  AgentMessage,
  TaskRequestPayload,
  MessageType,
} from '@/types/agentCommunicationProtocol';
import { agentRegistry } from './AgentRegistryService';

type MessageHandler = (message: AgentMessage) => void;

export class MessageRouterService implements MessageRouter {
  private subscribers: Map<string, MessageHandler[]> = new Map();
  private messageHistory: AgentMessage[] = [];
  private maxHistorySize = 1000;

  /**
   * Route a message to appropriate agent(s)
   */
  async route(message: AgentMessage): Promise<void> {
    // Store message in history
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }

    // Handle broadcast
    if (message.to === "broadcast") {
      await this.broadcast(message);
      return;
    }

    // Handle single recipient
    if (typeof message.to === 'string') {
      await this.deliverToAgent(message.to, message);
      return;
    }

    // Handle multiple recipients
    if (Array.isArray(message.to)) {
      await Promise.all(
        message.to.map(agentId => this.deliverToAgent(agentId, message))
      );
    }
  }

  /**
   * Find best agent for a task
   */
  async findBestAgent(task: TaskRequestPayload): Promise<string | null> {
    // Get all agents
    const allAgents = await agentRegistry.listAgents({ status: undefined });

    // Filter agents that have required capabilities
    const capableAgents = allAgents.filter(agent => {
      return task.requiredCapabilities.every(reqCap => {
        return agent.capabilities.some(cap => 
          cap.id === reqCap || 
          cap.name.toLowerCase().includes(reqCap.toLowerCase())
        );
      });
    });

    if (capableAgents.length === 0) {
      return null;
    }

    // Score agents based on multiple factors
    const scoredAgents = capableAgents.map(agent => {
      let score = 0;

      // Factor 1: Success rate (40%)
      if (agent.metrics) {
        const successRate = agent.metrics.totalTasks > 0
          ? agent.metrics.successfulTasks / agent.metrics.totalTasks
          : 0.5;
        score += successRate * 0.4;
      }

      // Factor 2: Response time (20%)
      if (agent.metrics && agent.metrics.averageResponseTime > 0) {
        const responseScore = Math.max(0, 1 - (agent.metrics.averageResponseTime / 10000));
        score += responseScore * 0.2;
      }

      // Factor 3: Capability match strength (30%)
      const matchedCaps = agent.capabilities.filter(cap =>
        task.requiredCapabilities.some(reqCap =>
          cap.id === reqCap || cap.name.toLowerCase().includes(reqCap.toLowerCase())
        )
      );
      const capabilityScore = matchedCaps.length / task.requiredCapabilities.length;
      score += capabilityScore * 0.3;

      // Factor 4: Current availability (10%)
      const availabilityScore = agent.status === 'idle' ? 1 : agent.status === 'busy' ? 0.3 : 0;
      score += availabilityScore * 0.1;

      return { agent, score };
    });

    // Sort by score and return best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    
    return scoredAgents[0]?.agent.id || null;
  }

  /**
   * Subscribe to messages for an agent
   */
  subscribe(agentId: string, handler: MessageHandler): void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    this.subscribers.get(agentId)!.push(handler);
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(agentId: string): void {
    this.subscribers.delete(agentId);
  }

  /**
   * Unsubscribe a specific handler
   */
  unsubscribeHandler(agentId: string, handler: MessageHandler): void {
    const handlers = this.subscribers.get(agentId);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      if (handlers.length === 0) {
        this.subscribers.delete(agentId);
      }
    }
  }

  /**
   * Deliver message to a specific agent
   */
  private async deliverToAgent(agentId: string, message: AgentMessage): Promise<void> {
    const handlers = this.subscribers.get(agentId);
    if (!handlers || handlers.length === 0) {
      console.warn(`No handlers registered for agent: ${agentId}`);
      return;
    }

    // Call all handlers
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in message handler for ${agentId}:`, error);
      }
    });
  }

  /**
   * Broadcast message to all subscribed agents
   */
  private async broadcast(message: AgentMessage): Promise<void> {
    const promises: Promise<void>[] = [];
    
    this.subscribers.forEach((handlers, agentId) => {
      if (agentId !== message.from) { // Don't send to sender
        promises.push(this.deliverToAgent(agentId, message));
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get message history
   */
  getHistory(filter?: {
    agentId?: string;
    messageType?: MessageType;
    conversationId?: string;
    limit?: number;
  }): AgentMessage[] {
    let history = [...this.messageHistory];

    if (filter) {
      if (filter.agentId) {
        history = history.filter(msg => 
          msg.from === filter.agentId || 
          msg.to === filter.agentId ||
          (Array.isArray(msg.to) && msg.to.includes(filter.agentId))
        );
      }

      if (filter.messageType) {
        history = history.filter(msg => msg.messageType === filter.messageType);
      }

      if (filter.conversationId) {
        history = history.filter(msg => msg.conversationId === filter.conversationId);
      }

      if (filter.limit) {
        history = history.slice(-filter.limit);
      }
    }

    return history;
  }

  /**
   * Get conversation thread
   */
  getConversationThread(conversationId: string): AgentMessage[] {
    return this.messageHistory.filter(msg => msg.conversationId === conversationId);
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Get routing statistics
   */
  getStats(): {
    totalMessages: number;
    messagesByType: Record<string, number>;
    activeSubscribers: number;
    messagesPerAgent: Record<string, number>;
  } {
    const messagesByType: Record<string, number> = {};
    const messagesPerAgent: Record<string, number> = {};

    this.messageHistory.forEach(msg => {
      // Count by type
      messagesByType[msg.messageType] = (messagesByType[msg.messageType] || 0) + 1;

      // Count per agent
      messagesPerAgent[msg.from] = (messagesPerAgent[msg.from] || 0) + 1;
    });

    return {
      totalMessages: this.messageHistory.length,
      messagesByType,
      activeSubscribers: this.subscribers.size,
      messagesPerAgent,
    };
  }
}

// Export singleton instance
export const messageRouter = new MessageRouterService();
