import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';
import { faker } from '@faker-js/faker';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockSocket = () => ({
  data: {} as Record<string, unknown>,
  emit: jest.fn(),
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  handshake: { auth: {} as Record<string, unknown> },
});

const mockMessagingService = {
  isConversationParticipant: jest.fn(),
};

const mockJwtService = {
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-jwt-secret'),
};

describe('MessagingGateway', () => {
  let gateway: MessagingGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingGateway,
        { provide: MessagingService, useValue: mockMessagingService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<MessagingGateway>(MessagingGateway);
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should set userId on socket data and join user room when token is valid', async () => {
      const userId = faker.string.uuid();
      const socket = mockSocket();
      socket.handshake.auth.token = 'valid-token';

      mockJwtService.verify.mockReturnValue({ sub: userId });

      await gateway.handleConnection(socket as unknown as Socket);

      expect(socket.data.userId).toBe(userId);
      expect(socket.join).toHaveBeenCalledWith(`user:${userId}`);
      expect(socket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client when no token is provided', async () => {
      const socket = mockSocket();

      await gateway.handleConnection(socket as unknown as Socket);

      expect(socket.disconnect).toHaveBeenCalled();
      expect(socket.join).not.toHaveBeenCalled();
    });

    it('should disconnect client when token verification throws', async () => {
      const socket = mockSocket();
      socket.handshake.auth.token = 'tampered-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new WsException('Invalid token');
      });

      await gateway.handleConnection(socket as unknown as Socket);

      expect(socket.disconnect).toHaveBeenCalled();
      expect(socket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleJoinConversation', () => {
    it('should join the conversation room when the user is a participant', async () => {
      const userId = faker.string.uuid();
      const conversationId = faker.string.uuid();
      const socket = mockSocket();
      socket.data.userId = userId;

      mockMessagingService.isConversationParticipant.mockResolvedValue(true);

      await gateway.handleJoinConversation(
        socket as unknown as Socket,
        conversationId,
      );

      expect(
        mockMessagingService.isConversationParticipant,
      ).toHaveBeenCalledWith(conversationId, userId);

      expect(socket.join).toHaveBeenCalledWith(
        `conversation:${conversationId}`,
      );

      expect(socket.emit).not.toHaveBeenCalledWith('error', expect.anything());
    });

    it('should emit an error event and leave the room when the user is not a participant', async () => {
      const userId = faker.string.uuid();
      const conversationId = faker.string.uuid();
      const socket = mockSocket();
      socket.data.userId = userId;

      mockMessagingService.isConversationParticipant.mockResolvedValue(false);

      await gateway.handleJoinConversation(
        socket as unknown as Socket,
        conversationId,
      );

      expect(socket.emit).toHaveBeenCalledWith('error', {
        message: 'Access denied',
      });

      expect(socket.leave).toHaveBeenCalledWith(
        `conversation:${conversationId}`,
      );

      expect(socket.join).not.toHaveBeenCalled();
    });
  });
});
