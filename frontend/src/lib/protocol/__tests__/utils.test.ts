/**
 * Tests for Protocol Utilities
 */

import {
  createMessage,
  createTaskRequest,
  createTaskComplete,
  createHandoff,
  createThought,
  createError,
  validateMessage,
  isMessageExpired,
  serializeMessage,
  deserializeMessage,
  generateConversationId,
  sortMessagesByTime,
  filterMessages,
} from '../utils';
import {
  MessageType,
  AgentMessage,
  ERROR_CODES,
} from '@/types/agentCommunicationProtocol';

describe('Protocol Utils', () => {
  describe('createMessage', () => {
    it('should create a valid ACP message', () => {
      const message = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        { content: 'test' }
      );

      expect(message.protocol).toMatch(/^ACP\//);
      expect(message.messageType).toBe(MessageType.QUERY);
      expect(message.from).toBe('agent1');
      expect(message.to).toBe('agent2');
      expect(message.messageId).toBeDefined();
      expect(message.timestamp).toBeDefined();
      expect(message.payload).toEqual({ content: 'test' });
    });

    it('should create a message with options', () => {
      const message = createMessage(
        MessageType.RESPONSE,
        'agent1',
        'agent2',
        { result: 'success' },
        {
          replyTo: 'msg123',
          conversationId: 'conv456',
          priority: 'high',
        }
      );

      expect(message.replyTo).toBe('msg123');
      expect(message.conversationId).toBe('conv456');
      expect(message.priority).toBe('high');
    });
  });

  describe('createTaskRequest', () => {
    it('should create a task request message', () => {
      const message = createTaskRequest('router', 'worker', {
        title: 'Test Task',
        description: 'Test description',
        requiredCapabilities: ['test_capability'],
      });

      expect(message.messageType).toBe(MessageType.TASK_REQUEST);
      expect(message.payload.taskId).toBeDefined();
      expect(message.payload.title).toBe('Test Task');
      expect(message.payload.requiredCapabilities).toContain('test_capability');
    });
  });

  describe('createTaskComplete', () => {
    it('should create a task completion message', () => {
      const message = createTaskComplete(
        'worker',
        'router',
        {
          taskId: 'task123',
          result: { success: true },
          summary: 'Task completed successfully',
        },
        'msg456'
      );

      expect(message.messageType).toBe(MessageType.TASK_COMPLETE);
      expect(message.payload.taskId).toBe('task123');
      expect(message.replyTo).toBe('msg456');
    });
  });

  describe('createHandoff', () => {
    it('should create a handoff message', () => {
      const message = createHandoff('agent1', 'router', {
        taskId: 'task123',
        reason: 'Needs specialized capability',
        targetAgent: 'agent2',
        context: {
          conversationHistory: [],
          completedSteps: ['step1'],
        },
      });

      expect(message.messageType).toBe(MessageType.HANDOFF);
      expect(message.payload.reason).toBe('Needs specialized capability');
    });
  });

  describe('createThought', () => {
    it('should create a thought message', () => {
      const message = createThought('agent1', 'user', {
        thought: 'Analyzing the request',
        reasoning: 'Need to break down the task',
        confidence: 0.8,
      });

      expect(message.messageType).toBe(MessageType.THOUGHT);
      expect(message.payload.thought).toBe('Analyzing the request');
    });
  });

  describe('createError', () => {
    it('should create an error message', () => {
      const message = createError(
        'agent1',
        'router',
        {
          code: ERROR_CODES.TASK_TIMEOUT,
          message: 'Task exceeded time limit',
          recoverable: true,
        },
        'msg789'
      );

      expect(message.messageType).toBe(MessageType.ERROR);
      expect(message.payload.code).toBe(ERROR_CODES.TASK_TIMEOUT);
      expect(message.priority).toBe('high');
      expect(message.replyTo).toBe('msg789');
    });
  });

  describe('validateMessage', () => {
    it('should validate a correct message', () => {
      const message = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        { test: true }
      );

      const result = validateMessage(message);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate a message missing protocol', () => {
      const message: any = {
        messageType: MessageType.QUERY,
        from: 'agent1',
        to: 'agent2',
        messageId: '123',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid protocol identifier');
    });

    it('should invalidate a message missing required fields', () => {
      const message: any = {
        protocol: 'ACP/1.0.0',
        messageType: MessageType.QUERY,
      };

      const result = validateMessage(message);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isMessageExpired', () => {
    it('should return false for message without TTL', () => {
      const message = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        {}
      );

      expect(isMessageExpired(message)).toBe(false);
    });

    it('should return false for non-expired message', () => {
      const message = createMessage(
        MessageType.QUERY,
        'agent1',
        'agent2',
        {},
        { ttl: 3600 }
      );

      expect(isMessageExpired(message)).toBe(false);
    });

    it('should return true for expired message', () => {
      const message: AgentMessage = {
        protocol: 'ACP/1.0.0',
        messageType: MessageType.QUERY,
        messageId: '123',
        from: 'agent1',
        to: 'agent2',
        timestamp: new Date(Date.now() - 10000).toISOString(), // 10 seconds ago
        payload: {},
        ttl: 5, // 5 seconds
      };

      expect(isMessageExpired(message)).toBe(true);
    });
  });

  describe('serializeMessage and deserializeMessage', () => {
    it('should serialize and deserialize a message', () => {
      const original = createMessage(
        MessageType.TASK_REQUEST,
        'agent1',
        'agent2',
        { task: 'test task' }
      );

      const serialized = serializeMessage(original);
      expect(typeof serialized).toBe('string');

      const deserialized = deserializeMessage(serialized);
      expect(deserialized.messageId).toBe(original.messageId);
      expect(deserialized.payload).toEqual(original.payload);
    });

    it('should throw error for invalid serialized data', () => {
      expect(() => deserializeMessage('invalid json')).toThrow();
    });
  });

  describe('generateConversationId', () => {
    it('should generate a conversation ID', () => {
      const id = generateConversationId();
      expect(id).toMatch(/^conv_/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateConversationId();
      const id2 = generateConversationId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('sortMessagesByTime', () => {
    it('should sort messages by timestamp', () => {
      const msg1: AgentMessage = {
        protocol: 'ACP/1.0.0',
        messageType: MessageType.QUERY,
        messageId: '1',
        from: 'agent1',
        to: 'agent2',
        timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
        payload: {},
      };

      const msg2: AgentMessage = {
        ...msg1,
        messageId: '2',
        timestamp: new Date('2024-01-01T09:00:00Z').toISOString(),
      };

      const msg3: AgentMessage = {
        ...msg1,
        messageId: '3',
        timestamp: new Date('2024-01-01T11:00:00Z').toISOString(),
      };

      const sorted = sortMessagesByTime([msg1, msg3, msg2]);
      expect(sorted[0].messageId).toBe('2');
      expect(sorted[1].messageId).toBe('1');
      expect(sorted[2].messageId).toBe('3');
    });
  });

  describe('filterMessages', () => {
    const messages: AgentMessage[] = [
      {
        protocol: 'ACP/1.0.0',
        messageType: MessageType.QUERY,
        messageId: '1',
        from: 'agent1',
        to: 'agent2',
        timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
        payload: {},
      },
      {
        protocol: 'ACP/1.0.0',
        messageType: MessageType.RESPONSE,
        messageId: '2',
        from: 'agent2',
        to: 'agent1',
        timestamp: new Date('2024-01-01T11:00:00Z').toISOString(),
        payload: {},
      },
    ];

    it('should filter messages by sender', () => {
      const filtered = filterMessages(messages, { from: 'agent1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].from).toBe('agent1');
    });

    it('should filter messages by recipient', () => {
      const filtered = filterMessages(messages, { to: 'agent1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].to).toBe('agent1');
    });

    it('should filter messages by type', () => {
      const filtered = filterMessages(messages, { type: MessageType.QUERY });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].messageType).toBe(MessageType.QUERY);
    });

    it('should filter messages by time range', () => {
      const filtered = filterMessages(messages, {
        after: new Date('2024-01-01T10:30:00Z'),
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].messageId).toBe('2');
    });
  });
});
