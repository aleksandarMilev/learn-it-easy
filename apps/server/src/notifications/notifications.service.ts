import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATIONS_QUEUE, NotificationJobs } from './notifications.queue';
import type { CreateNotificationDto } from './dto/create-notification.dto';
import { type Notification, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  async notify(dto: CreateNotificationDto): Promise<void> {
    await this.queue.add(NotificationJobs.CREATE_IN_APP, dto);
  }

  async notifyBookingCreated(
    tutorUserId: string,
    studentName: string,
    subject: string,
  ): Promise<void> {
    await this.notify({
      userId: tutorUserId,
      type: NotificationType.BOOKING_CREATED,
      title: 'New Booking Request',
      body: `${studentName} requested a session for ${subject}`,
    });
  }

  async notifyBookingConfirmed(
    studentUserId: string,
    tutorName: string,
    subject: string,
  ): Promise<void> {
    await this.notify({
      userId: studentUserId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking Confirmed',
      body: `${tutorName} confirmed your session for ${subject}`,
    });
  }

  async notifyBookingCancelled(userId: string, subject: string): Promise<void> {
    await this.notify({
      userId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      body: `Your session for ${subject} has been cancelled`,
    });
  }

  async notifyNewMessage(
    recipientId: string,
    senderName: string,
  ): Promise<void> {
    await this.notify({
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      body: `${senderName} sent you a message`,
    });
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async softDelete(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null },
    });
  }
}
