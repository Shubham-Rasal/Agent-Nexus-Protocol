/**
 * Protocol Adapter Factory
 * 
 * Factory for creating and managing protocol adapters
 */

import { ProtocolAdapter, AgentFramework } from '@/types/agentCommunicationProtocol';
import { LangChainAdapter } from './LangChainAdapter';
import { CrewAIAdapter } from './CrewAIAdapter';
import { OpenAIAssistantsAdapter } from './OpenAIAssistantsAdapter';
import { AutoGPTAdapter } from './AutoGPTAdapter';

export class AdapterFactory {
  private static adapters: Map<AgentFramework, ProtocolAdapter> = new Map();

  /**
   * Initialize all available adapters
   */
  static initialize(): void {
    this.adapters.set(AgentFramework.LANGCHAIN, new LangChainAdapter());
    this.adapters.set(AgentFramework.CREWAI, new CrewAIAdapter());
    this.adapters.set(AgentFramework.OPENAI_ASSISTANTS, new OpenAIAssistantsAdapter());
    this.adapters.set(AgentFramework.AUTOGPT, new AutoGPTAdapter());
  }

  /**
   * Get adapter for a specific framework
   */
  static getAdapter(framework: AgentFramework): ProtocolAdapter {
    if (this.adapters.size === 0) {
      this.initialize();
    }

    const adapter = this.adapters.get(framework);
    if (!adapter) {
      throw new Error(`No adapter found for framework: ${framework}`);
    }
    return adapter;
  }

  /**
   * Register a custom adapter
   */
  static registerAdapter(framework: AgentFramework, adapter: ProtocolAdapter): void {
    this.adapters.set(framework, adapter);
  }

  /**
   * List all available frameworks
   */
  static listFrameworks(): AgentFramework[] {
    if (this.adapters.size === 0) {
      this.initialize();
    }
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a framework is supported
   */
  static isSupported(framework: AgentFramework): boolean {
    if (this.adapters.size === 0) {
      this.initialize();
    }
    return this.adapters.has(framework);
  }

  /**
   * Get all adapters
   */
  static getAllAdapters(): Map<AgentFramework, ProtocolAdapter> {
    if (this.adapters.size === 0) {
      this.initialize();
    }
    return new Map(this.adapters);
  }
}

// Initialize adapters on module load
AdapterFactory.initialize();
