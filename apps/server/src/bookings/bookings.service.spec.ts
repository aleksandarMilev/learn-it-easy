import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, Prisma, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { NotificationsService } from '../notifications/notifications.service';

const ONE_HOUR_MS = 1_000 * 60 * 60;
const ONE_DAY_MS = ONE_HOUR_MS * 24;
const SESSION_DURATION_MS = ONE_HOUR_MS;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockTutor = () => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  subjects: ['Mathematics'],
  hourlyRate: 50,
  isApproved: true,
  deletedAt: null,
  user: {
    id: faker.string.uuid(),
    profile: {
      firstName: 'John',
      lastName: 'Doe',
    },
  },
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockBooking = (overrides = {}) => ({
  id: faker.string.uuid(),
  studentId: faker.string.uuid(),
  tutorId: faker.string.uuid(),
  startTime: new Date(Date.now() + ONE_DAY_MS),
  endTime: new Date(Date.now() + ONE_DAY_MS + SESSION_DURATION_MS),
  status: BookingStatus.PENDING,
  subject: 'Mathematics',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  tutor: {
    ...mockTutor(),
    user: {
      id: faker.string.uuid(),
      profile: { firstName: 'John', lastName: 'Doe' },
    },
  },
  student: {
    id: faker.string.uuid(),
    profile: { firstName: 'Jane', lastName: 'Smith' },
  },
  ...overrides,
});

const mockPrismaService = {
  tutorProfile: { findFirst: jest.fn() },
  booking: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockNotificationsService = {
  notifyBookingCreated: jest.fn().mockResolvedValue(undefined),
  notifyBookingConfirmed: jest.fn().mockResolvedValue(undefined),
  notifyBookingCancelled: jest.fn().mockResolvedValue(undefined),
};

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();

    mockPrismaService.$transaction.mockImplementation(
      (
        callback: (tx: typeof mockPrismaService) => Promise<unknown>,
        _options?: unknown,
      ) => callback(mockPrismaService),
    );
  });

  describe('create', () => {
    const studentId = faker.string.uuid();
    const dto = {
      tutorId: faker.string.uuid(),
      startTime: new Date(Date.now() + ONE_DAY_MS).toISOString(),
      endTime: new Date(
        Date.now() + ONE_DAY_MS + SESSION_DURATION_MS,
      ).toISOString(),
      subject: 'Mathematics',
      notes: undefined,
    };

    it('should create a booking successfully', async () => {
      const booking = mockBooking();
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.create.mockResolvedValue(booking);

      const result = await service.create(studentId, dto);

      expect(result).toEqual(booking);
      expect(mockPrismaService.booking.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if tutor not found', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(null);

      await expect(service.create(studentId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if startTime >= endTime', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());

      await expect(
        service.create(studentId, {
          ...dto,
          startTime: new Date(
            Date.now() + ONE_DAY_MS + SESSION_DURATION_MS,
          ).toISOString(),
          endTime: new Date(Date.now() + ONE_DAY_MS).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is in the past', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());

      await expect(
        service.create(studentId, {
          ...dto,
          startTime: new Date(Date.now() - ONE_DAY_MS).toISOString(),
          endTime: new Date(
            Date.now() - ONE_DAY_MS + SESSION_DURATION_MS,
          ).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if tutor has a conflict', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking());

      await expect(service.create(studentId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use Serializable isolation level for the booking transaction', async () => {
      const booking = mockBooking();
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.create.mockResolvedValue(booking);

      await service.create(studentId, dto);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });

    it('should throw BadRequestException when a serialization failure occurs (concurrent booking)', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());

      const serializationError = new Prisma.PrismaClientKnownRequestError(
        'Transaction failed due to a write conflict or a deadlock.',
        { code: 'P2034', clientVersion: '6.0.0' },
      );
      mockPrismaService.$transaction.mockRejectedValue(serializationError);

      const promise = service.create(studentId, dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow(
        'Tutor is not available for the selected time slot',
      );
    });

    it('should not send a notification when booking creation fails inside the transaction', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.create.mockRejectedValue(
        new Error('DB connection error'),
      );

      await expect(service.create(studentId, dto)).rejects.toThrow(
        'DB connection error',
      );

      expect(
        mockNotificationsService.notifyBookingCreated,
      ).not.toHaveBeenCalled();
    });
  });

  describe('conflict detection', () => {
    const studentId = faker.string.uuid();
    const dto = {
      tutorId: faker.string.uuid(),
      startTime: new Date(Date.now() + ONE_DAY_MS).toISOString(),
      endTime: new Date(
        Date.now() + ONE_DAY_MS + SESSION_DURATION_MS,
      ).toISOString(),
      subject: 'Mathematics',
      notes: undefined,
    };

    it('should throw BadRequestException when a new booking overlaps with an existing CONFIRMED booking for the same tutor', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());
      mockPrismaService.booking.findFirst.mockResolvedValue(
        mockBooking({ status: BookingStatus.CONFIRMED }),
      );

      await expect(service.create(studentId, dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPrismaService.booking.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when a new booking overlaps with an existing PENDING booking', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());
      mockPrismaService.booking.findFirst.mockResolvedValue(
        mockBooking({ status: BookingStatus.PENDING }),
      );

      await expect(service.create(studentId, dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPrismaService.booking.create).not.toHaveBeenCalled();
    });

    it('should use correct overlap detection: startTime < existingEnd AND endTime > existingStart', async () => {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);
      const booking = mockBooking();

      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.create.mockResolvedValue(booking);

      await service.create(studentId, dto);

      expect(mockPrismaService.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
          }),
        }),
      );
      expect(mockPrismaService.booking.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings for a student', async () => {
      const bookings = [mockBooking(), mockBooking()];
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll(
        faker.string.uuid(),
        Role.STUDENT,
        {},
      );

      expect(result.data).toEqual(bookings);
      expect(result.nextCursor).toBeNull();
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ studentId: expect.any(String) }),
        }),
      );
    });

    it('should return paginated bookings for admin with no cursor', async () => {
      const bookings = [mockBooking(), mockBooking(), mockBooking()];
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll(faker.string.uuid(), Role.ADMIN, {});

      expect(result.data).toEqual(bookings);
      expect(result.nextCursor).toBeNull();
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
        }),
      );
    });

    it('should return nextCursor when more items exist beyond the page size', async () => {
      const take = 2;
      const bookings = [mockBooking(), mockBooking(), mockBooking()];
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll(faker.string.uuid(), Role.STUDENT, {
        take,
      });

      expect(result.data).toHaveLength(take);
      expect(result.nextCursor).toBe(bookings[take - 1]?.id);
    });

    it('should return null nextCursor when items fit within the page size', async () => {
      const bookings = [mockBooking(), mockBooking()];
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll(faker.string.uuid(), Role.STUDENT, {
        take: 20,
      });

      expect(result.nextCursor).toBeNull();
    });

    it('should pass cursor and skip to the query when cursor is provided', async () => {
      const cursor = faker.string.uuid();
      mockPrismaService.booking.findMany.mockResolvedValue([mockBooking()]);

      await service.findAll(faker.string.uuid(), Role.STUDENT, { cursor });

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: cursor },
          skip: 1,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a booking for the student who owns it', async () => {
      const studentId = faker.string.uuid();
      const booking = mockBooking({ studentId });
      mockPrismaService.booking.findFirst.mockResolvedValue(booking);

      const result = await service.findOne(booking.id, studentId, Role.STUDENT);

      expect(result).toEqual(booking);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(faker.string.uuid(), faker.string.uuid(), Role.STUDENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not related to booking', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(mockBooking());

      await expect(
        service.findOne(faker.string.uuid(), faker.string.uuid(), Role.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('should allow tutor to confirm a booking', async () => {
      const tutorUserId = faker.string.uuid();
      const booking = mockBooking({
        tutor: { ...mockTutor(), userId: tutorUserId },
      });

      mockPrismaService.booking.findFirst.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.updateStatus(
        booking.id,
        tutorUserId,
        Role.TUTOR,
        { status: BookingStatus.CONFIRMED },
      );

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw ForbiddenException if student tries to confirm', async () => {
      const studentId = faker.string.uuid();
      const booking = mockBooking({ studentId });
      mockPrismaService.booking.findFirst.mockResolvedValue(booking);

      await expect(
        service.updateStatus(booking.id, studentId, Role.STUDENT, {
          status: BookingStatus.CONFIRMED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(
          faker.string.uuid(),
          faker.string.uuid(),
          Role.STUDENT,
          {
            status: BookingStatus.CANCELLED,
          },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a booking for the student', async () => {
      const studentId = faker.string.uuid();
      const booking = mockBooking({ studentId });
      const deletedBooking = { ...booking, deletedAt: new Date() };

      mockPrismaService.booking.findFirst.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue(deletedBooking);

      const result = await service.softDelete(
        booking.id,
        studentId,
        Role.STUDENT,
      );

      expect(result.deletedAt).not.toBeNull();
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: booking.id },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw ForbiddenException if user is not student or admin', async () => {
      const booking = mockBooking();
      mockPrismaService.booking.findFirst.mockResolvedValue(booking);

      await expect(
        service.softDelete(booking.id, faker.string.uuid(), Role.TUTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete(
          faker.string.uuid(),
          faker.string.uuid(),
          Role.STUDENT,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
