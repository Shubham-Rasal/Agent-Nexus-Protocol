/**
 * Tests for Agent Registry Service
 */

import { AgentRegistryService } from '../services/AgentRegistryService';
import {
  AgentFramework,
  AgentStatus,
  CapabilityCategory,
  AgentMetadata,
} from '@/types/agentCommunicationProtocol';

describe('AgentRegistryService', () => {
  let registry: AgentRegistryService;

  const testAgent: AgentMetadata = {
    id: 'test-agent-001',
    name: 'Test Agent',
    description: 'A test agent for unit tests',
    version: '1.0.0',
    framework: AgentFramework.CUSTOM,
    capabilities: [
      {
        id: 'test_capability',
        name: 'Test Capability',
        category: CapabilityCategory.GENERAL,
        description: 'A test capability',
      },
    ],
    tags: ['test', 'demo'],
    status: AgentStatus.IDLE,
  };

  beforeEach(() => {
    registry = new AgentRegistryService();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('register', () => {
    it('should register a new agent', async () => {
      await registry.register(testAgent);
      const agent = await registry.getAgent(testAgent.id);
      expect(agent).toEqual(testAgent);
    });

    it('should throw error for invalid agent (missing ID)', async () => {
      const invalidAgent = { ...testAgent, id: '' };
      await expect(registry.register(invalidAgent as any)).rejects.toThrow('Agent ID is required');
    });

    it('should throw error for agent without capabilities', async () => {
      const invalidAgent = { ...testAgent, capabilities: [] };
      await expect(registry.register(invalidAgent)).rejects.toThrow(
        'Agent must have at least one capability'
      );
    });

    it('should index agent by capabilities', async () => {
      await registry.register(testAgent);
      const agents = await registry.findByCapability('test_capability');
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe(testAgent.id);
    });

    it('should index agent by tags', async () => {
      await registry.register(testAgent);
      const agents = await registry.findByTag('test');
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe(testAgent.id);
    });
  });

  describe('unregister', () => {
    it('should unregister an existing agent', async () => {
      await registry.register(testAgent);
      await registry.unregister(testAgent.id);
      const agent = await registry.getAgent(testAgent.id);
      expect(agent).toBeNull();
    });

    it('should throw error for non-existent agent', async () => {
      await expect(registry.unregister('non-existent')).rejects.toThrow('Agent not found');
    });

    it('should remove agent from capability index', async () => {
      await registry.register(testAgent);
      await registry.unregister(testAgent.id);
      const agents = await registry.findByCapability('test_capability');
      expect(agents).toHaveLength(0);
    });

    it('should remove agent from tag index', async () => {
      await registry.register(testAgent);
      await registry.unregister(testAgent.id);
      const agents = await registry.findByTag('test');
      expect(agents).toHaveLength(0);
    });
  });

  describe('findByCapability', () => {
    it('should find agents with specific capability', async () => {
      const agent1 = { ...testAgent, id: 'agent1' };
      const agent2 = {
        ...testAgent,
        id: 'agent2',
        capabilities: [
          {
            id: 'other_capability',
            name: 'Other',
            category: CapabilityCategory.GENERAL,
            description: 'Other',
          },
        ],
      };

      await registry.register(agent1);
      await registry.register(agent2);

      const found = await registry.findByCapability('test_capability');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('agent1');
    });

    it('should return empty array for non-existent capability', async () => {
      const found = await registry.findByCapability('non_existent');
      expect(found).toHaveLength(0);
    });
  });

  describe('findByTag', () => {
    it('should find agents with specific tag', async () => {
      const agent1 = { ...testAgent, id: 'agent1', tags: ['test', 'demo'] };
      const agent2 = { ...testAgent, id: 'agent2', tags: ['production'] };

      await registry.register(agent1);
      await registry.register(agent2);

      const found = await registry.findByTag('test');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('agent1');
    });

    it('should return empty array for non-existent tag', async () => {
      const found = await registry.findByTag('non_existent');
      expect(found).toHaveLength(0);
    });
  });

  describe('listAgents', () => {
    it('should list all agents', async () => {
      const agent1 = { ...testAgent, id: 'agent1' };
      const agent2 = { ...testAgent, id: 'agent2' };

      await registry.register(agent1);
      await registry.register(agent2);

      const agents = await registry.listAgents();
      expect(agents).toHaveLength(2);
    });

    it('should filter agents by status', async () => {
      const agent1 = { ...testAgent, id: 'agent1', status: AgentStatus.IDLE };
      const agent2 = { ...testAgent, id: 'agent2', status: AgentStatus.BUSY };

      await registry.register(agent1);
      await registry.register(agent2);

      const idleAgents = await registry.listAgents({ status: AgentStatus.IDLE });
      expect(idleAgents).toHaveLength(1);
      expect(idleAgents[0].id).toBe('agent1');
    });

    it('should filter agents by framework', async () => {
      const agent1 = { ...testAgent, id: 'agent1', framework: AgentFramework.LANGCHAIN };
      const agent2 = { ...testAgent, id: 'agent2', framework: AgentFramework.CREWAI };

      await registry.register(agent1);
      await registry.register(agent2);

      const langchainAgents = await registry.listAgents({ framework: AgentFramework.LANGCHAIN });
      expect(langchainAgents).toHaveLength(1);
      expect(langchainAgents[0].id).toBe('agent1');
    });
  });

  describe('updateStatus', () => {
    it('should update agent status', async () => {
      await registry.register(testAgent);
      await registry.updateStatus(testAgent.id, AgentStatus.BUSY);
      
      const agent = await registry.getAgent(testAgent.id);
      expect(agent?.status).toBe(AgentStatus.BUSY);
    });

    it('should throw error for non-existent agent', async () => {
      await expect(
        registry.updateStatus('non-existent', AgentStatus.BUSY)
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('updateMetrics', () => {
    it('should initialize metrics if not present', async () => {
      await registry.register(testAgent);
      await registry.updateMetrics(testAgent.id, { taskCompleted: true });
      
      const agent = await registry.getAgent(testAgent.id);
      expect(agent?.metrics).toBeDefined();
      expect(agent?.metrics?.totalTasks).toBe(1);
      expect(agent?.metrics?.successfulTasks).toBe(1);
    });

    it('should track successful tasks', async () => {
      await registry.register(testAgent);
      await registry.updateMetrics(testAgent.id, { taskCompleted: true });
      await registry.updateMetrics(testAgent.id, { taskCompleted: true });
      
      const agent = await registry.getAgent(testAgent.id);
      expect(agent?.metrics?.totalTasks).toBe(2);
      expect(agent?.metrics?.successfulTasks).toBe(2);
    });

    it('should track failed tasks', async () => {
      await registry.register(testAgent);
      await registry.updateMetrics(testAgent.id, { taskFailed: true });
      
      const agent = await registry.getAgent(testAgent.id);
      expect(agent?.metrics?.totalTasks).toBe(1);
      expect(agent?.metrics?.failedTasks).toBe(1);
    });

    it('should calculate average response time', async () => {
      await registry.register(testAgent);
      await registry.updateMetrics(testAgent.id, { taskCompleted: true, responseTime: 100 });
      await registry.updateMetrics(testAgent.id, { taskCompleted: true, responseTime: 200 });
      
      const agent = await registry.getAgent(testAgent.id);
      expect(agent?.metrics?.averageResponseTime).toBe(150);
    });
  });

  describe('search', () => {
    it('should search agents by name', async () => {
      await registry.register(testAgent);
      const results = await registry.search('Test Agent');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(testAgent.id);
    });

    it('should search agents by description', async () => {
      await registry.register(testAgent);
      const results = await registry.search('unit tests');
      expect(results).toHaveLength(1);
    });

    it('should search agents by tag', async () => {
      await registry.register(testAgent);
      const results = await registry.search('demo');
      expect(results).toHaveLength(1);
    });

    it('should search agents by capability', async () => {
      await registry.register(testAgent);
      const results = await registry.search('Test Capability');
      expect(results).toHaveLength(1);
    });

    it('should be case insensitive', async () => {
      await registry.register(testAgent);
      const results = await registry.search('test agent');
      expect(results).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const agent1 = { ...testAgent, id: 'agent1', framework: AgentFramework.LANGCHAIN };
      const agent2 = { ...testAgent, id: 'agent2', framework: AgentFramework.LANGCHAIN };
      const agent3 = { ...testAgent, id: 'agent3', framework: AgentFramework.CREWAI };

      await registry.register(agent1);
      await registry.register(agent2);
      await registry.register(agent3);

      const stats = registry.getStats();
      expect(stats.totalAgents).toBe(3);
      expect(stats.activeAgents).toBe(3);
      expect(stats.frameworkDistribution[AgentFramework.LANGCHAIN]).toBe(2);
      expect(stats.frameworkDistribution[AgentFramework.CREWAI]).toBe(1);
    });
  });
});
