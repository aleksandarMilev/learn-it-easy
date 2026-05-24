import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { faker } from '@faker-js/faker';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockConversation = (overrides = {}) => ({
  id: faker.string.uuid(),
  studentId: faker.string.uuid(),
  tutorId: faker.string.uuid(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockMessage = (overrides = {}) => ({
  id: faker.string.uuid(),
  conversationId: faker.string.uuid(),
  senderId: faker.string.uuid(),
  content: 'Hello!',
  createdAt: new Date(),
  deletedAt: null,
  sender: { id: faker.string.uuid(), profile: null },
  ...overrides,
});

const mockPrismaService = {
  user: { findFirst: jest.fn() },
  conversation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  message: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    const studentId = faker.string.uuid();
    const dto = { tutorUserId: faker.string.uuid() };

    it('should create a new conversation', async () => {
      const conversation = mockConversation({
        studentId,
        tutorId: dto.tutorUserId,
      });
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: dto.tutorUserId,
      });
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);
      mockPrismaService.conversation.create.mockResolvedValue(conversation);

      const result = await service.createConversation(studentId, dto);

      expect(result).toEqual(conversation);
      expect(mockPrismaService.conversation.create).toHaveBeenCalledTimes(1);
    });

    it('should return existing conversation if already exists', async () => {
      const existing = mockConversation({
        studentId,
        tutorId: dto.tutorUserId,
      });
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: dto.tutorUserId,
      });
      mockPrismaService.conversation.findUnique.mockResolvedValue(existing);

      const result = await service.createConversation(studentId, dto);

      expect(result).toEqual(existing);
      expect(mockPrismaService.conversation.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if tutor not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.createConversation(studentId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findConversations', () => {
    it('should return all conversations for a user', async () => {
      const userId = faker.string.uuid();
      const conversations = [mockConversation(), mockConversation()];
      mockPrismaService.conversation.findMany.mockResolvedValue(conversations);

      const result = await service.findConversations(userId);

      expect(result).toEqual(conversations);
      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ studentId: userId }, { tutorId: userId }],
          }),
        }),
      );
    });
  });

  describe('findMessages', () => {
    it('should return messages for a conversation participant', async () => {
      const userId = faker.string.uuid();
      const conversation = mockConversation({ studentId: userId });
      const messages = [mockMessage(), mockMessage()];
      mockPrismaService.conversation.findFirst.mockResolvedValue(conversation);
      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await service.findMessages(conversation.id, userId);

      expect(result).toEqual(messages);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.findMessages(faker.string.uuid(), faker.string.uuid()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation(),
      );

      await expect(
        service.findMessages(faker.string.uuid(), faker.string.uuid()),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendMessage', () => {
    it('should send a message in a conversation', async () => {
      const senderId = faker.string.uuid();
      const conversation = mockConversation({ studentId: senderId });
      const message = mockMessage({
        senderId,
        conversationId: conversation.id,
      });
      mockPrismaService.conversation.findFirst.mockResolvedValue(conversation);
      mockPrismaService.message.create.mockResolvedValue(message);
      mockPrismaService.conversation.update.mockResolvedValue(conversation);

      const result = await service.sendMessage(senderId, {
        conversationId: conversation.id,
        content: 'Hello!',
      });

      expect(result).toEqual(message);
      expect(mockPrismaService.message.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage(faker.string.uuid(), {
          conversationId: faker.string.uuid(),
          content: 'Hello!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if sender is not a participant', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation(),
      );

      await expect(
        service.sendMessage(faker.string.uuid(), {
          conversationId: faker.string.uuid(),
          content: 'Hello!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDeleteMessage', () => {
    it('should soft delete a message by sender', async () => {
      const senderId = faker.string.uuid();
      const message = mockMessage({ senderId });
      const deleted = { ...message, deletedAt: new Date() };
      mockPrismaService.message.findFirst.mockResolvedValue(message);
      mockPrismaService.message.update.mockResolvedValue(deleted);

      const result = await service.softDeleteMessage(message.id, senderId);

      expect(result.deletedAt).not.toBeNull();
    });

    it('should throw ForbiddenException if not the sender', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(mockMessage());

      await expect(
        service.softDeleteMessage(faker.string.uuid(), faker.string.uuid()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(null);

      await expect(
        service.softDeleteMessage(faker.string.uuid(), faker.string.uuid()),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
