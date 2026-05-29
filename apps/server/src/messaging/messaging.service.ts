import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { SendMessageDto } from './dto/send-message.dto';
import { type Conversation, type Message } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { ConversationWithDetails } from './types/conversation-with-details.type';
import { MessageWithSender } from './types/message-with-sender.type';
import {
  CursorPaginationDto,
  DEFAULT_PAGE_SIZE,
} from '../common/dto/cursor-pagination.dto';
import type { PaginatedResult } from '../common/types/paginated-result.type';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createConversation(
    studentId: string,
    dto: CreateConversationDto,
  ): Promise<Conversation> {
    const tutor = await this.prisma.user.findFirst({
      where: { id: dto.tutorUserId, deletedAt: null },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    const existing = await this.prisma.conversation.findUnique({
      where: {
        studentId_tutorId: {
          studentId,
          tutorId: dto.tutorUserId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        studentId,
        tutorId: dto.tutorUserId,
      },
    });
  }

  async findConversations(
    userId: string,
    query: CursorPaginationDto,
  ): Promise<PaginatedResult<ConversationWithDetails>> {
    const take = query.take ?? DEFAULT_PAGE_SIZE;
    const items = await this.prisma.conversation.findMany({
      where: {
        deletedAt: null,
        OR: [{ studentId: userId }, { tutorId: userId }],
      },
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        student: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        tutor: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    const hasNextPage = items.length > take;
    const data = hasNextPage ? items.slice(0, take) : items;
    const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null;

    return { data, nextCursor };
  }

  async findMessages(
    conversationId: string,
    userId: string,
  ): Promise<MessageWithSender[]> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.studentId !== userId && conversation.tutorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: {
        sender: { select: { id: true, profile: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(
    senderId: string,
    dto: SendMessageDto,
  ): Promise<MessageWithSender> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: dto.conversationId, deletedAt: null },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.studentId !== senderId &&
      conversation.tutorId !== senderId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: { select: { id: true, profile: true } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    const recipientId =
      conversation.studentId === senderId
        ? conversation.tutorId
        : conversation.studentId;

    const senderProfile = message.sender.profile;
    const senderName = senderProfile
      ? `${senderProfile.firstName} ${senderProfile.lastName}`
      : 'Someone';

    await this.notificationsService.notifyNewMessage(recipientId, senderName);

    return message;
  }

  async isConversationParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        deletedAt: null,
        OR: [{ studentId: userId }, { tutorId: userId }],
      },
    });

    return conversation !== null;
  }

  async softDeleteMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, deletedAt: null },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }
}
