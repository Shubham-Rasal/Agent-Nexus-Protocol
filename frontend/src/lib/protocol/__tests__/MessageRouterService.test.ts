/**
 * Tests for Message Router Service
 */

import { MessageRouterService } from '../services/MessageRouterService';
import { AgentRegistryService } from '../services/AgentRegistryService';
import {
  MessageType,
  AgentFramework,
  AgentStatus,
  CapabilityCategory,
  AgentMetadata,
} from '@/types/agentCommunicationProtocol';
import { createMessage, createTaskRequest } from '../utils';

describe('MessageRouterService', () => {
  let router: MessageRouterService;
  let registry: AgentRegistryService;

  beforeEach(() => {
    router = new MessageRouterService();
    registry = new AgentRegistryService();
  });

  afterEach(() => {
    router.clearHistory();
    registry.clear();
  });

  describe('route', () => {
    it('should route message to single recipient', async () => {
      const receivedMessages: any[] = [];
      router.subscribe('agent2', (msg) => receivedMessages.push(msg));

      const message = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        { content: 'test' }
      );

      await router.route(message);

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].messageId).toBe(message.messageId);
    });

    it('should route message to multiple recipients', async () => {
      const received1: any[] = [];
      const received2: any[] = [];

      router.subscribe('agent2', (msg) => received1.push(msg));
      router.subscribe('agent3', (msg) => received2.push(msg));

      const message = createMessage(
        MessageType.QUERY,
        'agent1',
        ['agent2', 'agent3'],
        { content: 'test' }
      );

      await router.route(message);

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);
    });

    it('should broadcast to all subscribers except sender', async () => {
      const received1: any[] = [];
      const received2: any[] = [];
      const received3: any[] = [];

      router.subscribe('agent1', (msg) => received1.push(msg));
      router.subscribe('agent2', (msg) => received2.push(msg));
      router.subscribe('agent3', (msg) => received3.push(msg));

      const message = createMessage(
        MessageType.QUERY,
        'agent1',
        'broadcast',
        { content: 'test' }
      );

      await router.route(message);

      expect(received1).toHaveLength(0); // Sender doesn't receive
      expect(received2).toHaveLength(1);
      expect(received3).toHaveLength(1);
    });

    it('should store message in history', async () => {
      const message = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        { content: 'test' }
      );

      await router.route(message);

      const history = router.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].messageId).toBe(message.messageId);
    });
  });

  describe('findBestAgent', () => {
    const createTestAgent = (
      id: string,
      capabilities: string[],
      metrics?: any
    ): AgentMetadata => ({
      id,
      name: `Agent ${id}`,
      description: 'Test agent',
      version: '1.0.0',
      framework: AgentFramework.CUSTOM,
      capabilities: capabilities.map(cap => ({
        id: cap,
        name: cap,
        category: CapabilityCategory.GENERAL,
        description: cap,
      })),
      tags: [],
      status: AgentStatus.IDLE,
      metrics,
    });

    it('should return null if no capable agent found', async () => {
      await registry.register(
        createTestAgent('agent1', ['capability_a'])
      );

      const task = {
        taskId: 'task1',
        title: 'Test Task',
        description: 'Test',
        requiredCapabilities: ['capability_b'],
      };

      const bestAgent = await router.findBestAgent(task);
      expect(bestAgent).toBeNull();
    });

    it('should find agent with required capabilities', async () => {
      await registry.register(
        createTestAgent('agent1', ['search', 'analyze'])
      );

      const task = {
        taskId: 'task1',
        title: 'Test Task',
        description: 'Test',
        requiredCapabilities: ['search'],
      };

      const bestAgent = await router.findBestAgent(task);
      expect(bestAgent).toBe('agent1');
    });

    it('should prefer agent with better success rate', async () => {
      await registry.register(
        createTestAgent('agent1', ['search'], {
          totalTasks: 10,
          successfulTasks: 5,
          failedTasks: 5,
          averageResponseTime: 1000,
          lastActiveTime: new Date(),
        })
      );

      await registry.register(
        createTestAgent('agent2', ['search'], {
          totalTasks: 10,
          successfulTasks: 9,
          failedTasks: 1,
          averageResponseTime: 1000,
          lastActiveTime: new Date(),
        })
      );

      const task = {
        taskId: 'task1',
        title: 'Test Task',
        description: 'Test',
        requiredCapabilities: ['search'],
      };

      const bestAgent = await router.findBestAgent(task);
      expect(bestAgent).toBe('agent2'); // Higher success rate
    });

    it('should prefer idle agents over busy agents', async () => {
      const agent1 = createTestAgent('agent1', ['search']);
      agent1.status = AgentStatus.BUSY;
      await registry.register(agent1);

      const agent2 = createTestAgent('agent2', ['search']);
      agent2.status = AgentStatus.IDLE;
      await registry.register(agent2);

      const task = {
        taskId: 'task1',
        title: 'Test Task',
        description: 'Test',
        requiredCapabilities: ['search'],
      };

      const bestAgent = await router.findBestAgent(task);
      expect(bestAgent).toBe('agent2');
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should subscribe to messages', () => {
      const handler = jest.fn();
      router.subscribe('agent1', handler);

      const message = createMessage(
        MessageType.QUERY,
        'agent2',
        'agent1',
        { content: 'test' }
      );

      router.route(message);

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should unsubscribe from messages', async () => {
      const handler = jest.fn();
      router.subscribe('agent1', handler);
      router.unsubscribe('agent1');

      const message = createMessage(
        MessageType.QUERY,
        'agent2',
        'agent1',
        { content: 'test' }
      );

      await router.route(message);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple handlers for same agent', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      router.subscribe('agent1', handler1);
      router.subscribe('agent1', handler2);

      const message = createMessage(
        MessageType.QUERY,
        'agent2',
        'agent1',
        { content: 'test' }
      );

      await router.route(message);

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });
  });

  describe('getHistory', () => {
    it('should return all messages', async () => {
      const msg1 = createMessage(MessageType.QUERY, 'agent1', 'agent2', {});
      const msg2 = createMessage(MessageType.RESPONSE, 'agent2', 'agent1', {});

      await router.route(msg1);
      await router.route(msg2);

      const history = router.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should filter by agent ID', async () => {
      const msg1 = createMessage(MessageType.QUERY, 'agent1', 'agent2', {});
      const msg2 = createMessage(MessageType.QUERY, 'agent3', 'agent2', {});

      await router.route(msg1);
      await router.route(msg2);

      const history = router.getHistory({ agentId: 'agent1' });
      expect(history).toHaveLength(1);
      expect(history[0].from).toBe('agent1');
    });

    it('should filter by message type', async () => {
      const msg1 = createMessage(MessageType.QUERY, 'agent1', 'agent2', {});
      const msg2 = createMessage(MessageType.RESPONSE, 'agent2', 'agent1', {});

      await router.route(msg1);
      await router.route(msg2);

      const history = router.getHistory({ messageType: MessageType.QUERY });
      expect(history).toHaveLength(1);
      expect(history[0].messageType).toBe(MessageType.QUERY);
    });

    it('should filter by conversation ID', async () => {
      const msg1 = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        {},
        { conversationId: 'conv1' }
      );
      const msg2 = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        {},
        { conversationId: 'conv2' }
      );

      await router.route(msg1);
      await router.route(msg2);

      const history = router.getHistory({ conversationId: 'conv1' });
      expect(history).toHaveLength(1);
      expect(history[0].conversationId).toBe('conv1');
    });

    it('should limit results', async () => {
      for (let i = 0; i < 5; i++) {
        const msg = createMessage(MessageType.QUERY, 'agent1', 'agent2', {});
        await router.route(msg);
      }

      const history = router.getHistory({ limit: 3 });
      expect(history).toHaveLength(3);
    });
  });

  describe('getConversationThread', () => {
    it('should return messages from same conversation', async () => {
      const msg1 = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        {},
        { conversationId: 'conv1' }
      );
      const msg2 = createMessage(
        MessageType.RESPONSE,
        'agent2',
        'agent1',
        {},
        { conversationId: 'conv1' }
      );
      const msg3 = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        {},
        { conversationId: 'conv2' }
      );

      await router.route(msg1);
      await router.route(msg2);
      await router.route(msg3);

      const thread = router.getConversationThread('conv1');
      expect(thread).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should return routing statistics', async () => {
      router.subscribe('agent1', () => {});
      router.subscribe('agent2', () => {});

      const msg1 = createMessage(MessageType.QUERY, 'agent1', 'agent2', {});
      const msg2 = createMessage(MessageType.RESPONSE, 'agent2', 'agent1', {});

      await router.route(msg1);
      await router.route(msg2);

      const stats = router.getStats();
      expect(stats.totalMessages).toBe(2);
      expect(stats.activeSubscribers).toBe(2);
      expect(stats.messagesByType[MessageType.QUERY]).toBe(1);
      expect(stats.messagesByType[MessageType.RESPONSE]).toBe(1);
    });
  });
});
