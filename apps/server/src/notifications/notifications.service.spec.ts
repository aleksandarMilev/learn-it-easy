import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATIONS_QUEUE } from './notifications.queue';
import { NotificationType } from '@prisma/client';
import { faker } from '@faker-js/faker';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockNotification = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  type: NotificationType.BOOKING_CREATED,
  title: 'New Booking Request',
  body: 'Someone booked you',
  isRead: false,
  createdAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const mockPrismaService = {
  notification: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

const mockQueue = {
  add: jest.fn().mockResolvedValue({}),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: getQueueToken(NOTIFICATIONS_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('notify', () => {
    it('should add a job to the queue', async () => {
      const dto = {
        userId: faker.string.uuid(),
        type: NotificationType.BOOKING_CREATED,
        title: 'Test',
        body: 'Test body',
      };

      await service.notify(dto);

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('notifyBookingCreated', () => {
    it('should queue a booking created notification', async () => {
      await service.notifyBookingCreated(
        faker.string.uuid(),
        'John Doe',
        'Mathematics',
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'create-in-app',
        expect.objectContaining({
          type: NotificationType.BOOKING_CREATED,
          title: 'New Booking Request',
        }),
      );
    });
  });

  describe('notifyBookingConfirmed', () => {
    it('should queue a booking confirmed notification', async () => {
      await service.notifyBookingConfirmed(
        faker.string.uuid(),
        'Jane Smith',
        'Physics',
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'create-in-app',
        expect.objectContaining({
          type: NotificationType.BOOKING_CONFIRMED,
          title: 'Booking Confirmed',
        }),
      );
    });
  });

  describe('notifyBookingCancelled', () => {
    it('should queue a booking cancelled notification', async () => {
      await service.notifyBookingCancelled(faker.string.uuid(), 'Mathematics');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'create-in-app',
        expect.objectContaining({
          type: NotificationType.BOOKING_CANCELLED,
          title: 'Booking Cancelled',
        }),
      );
    });
  });

  describe('notifyNewMessage', () => {
    it('should queue a new message notification', async () => {
      await service.notifyNewMessage(faker.string.uuid(), 'John Doe');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'create-in-app',
        expect.objectContaining({
          type: NotificationType.NEW_MESSAGE,
          title: 'New Message',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all notifications for a user', async () => {
      const userId = faker.string.uuid();
      const notifications = [
        mockNotification({ userId }),
        mockNotification({ userId }),
      ];
      mockPrismaService.notification.findMany.mockResolvedValue(notifications);

      const result = await service.findAll(userId);

      expect(result).toEqual(notifications);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, deletedAt: null },
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const userId = faker.string.uuid();
      const notification = mockNotification({ userId });
      const updated = { ...notification, isRead: true };
      mockPrismaService.notification.findFirst.mockResolvedValue(notification);
      mockPrismaService.notification.update.mockResolvedValue(updated);

      const result = await service.markAsRead(notification.id, userId);

      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsRead(faker.string.uuid(), faker.string.uuid()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a notification', async () => {
      const userId = faker.string.uuid();
      const notification = mockNotification({ userId });
      const deleted = { ...notification, deletedAt: new Date() };
      mockPrismaService.notification.findFirst.mockResolvedValue(notification);
      mockPrismaService.notification.update.mockResolvedValue(deleted);

      const result = await service.softDelete(notification.id, userId);

      expect(result.deletedAt).not.toBeNull();
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete(faker.string.uuid(), faker.string.uuid()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      const userId = faker.string.uuid();
      mockPrismaService.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(userId);

      expect(result).toBe(3);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId, isRead: false, deletedAt: null },
      });
    });
  });
});
