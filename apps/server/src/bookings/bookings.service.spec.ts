import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockTutor = () => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  subjects: ['Mathematics'],
  hourlyRate: 50,
  isApproved: true,
  deletedAt: null,
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockBooking = (overrides = {}) => ({
  id: faker.string.uuid(),
  studentId: faker.string.uuid(),
  tutorId: faker.string.uuid(),
  startTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
  endTime: new Date(Date.now() + 1000 * 60 * 60 * 25),
  status: BookingStatus.PENDING,
  subject: 'Mathematics',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  tutor: mockTutor(),
  student: { id: faker.string.uuid(), profile: null },
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
};

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const studentId = faker.string.uuid();
    const dto = {
      tutorId: faker.string.uuid(),
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
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
          startTime: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is in the past', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(mockTutor());

      await expect(
        service.create(studentId, {
          ...dto,
          startTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          endTime: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
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
  });

  describe('findAll', () => {
    it('should return bookings for a student', async () => {
      const bookings = [mockBooking(), mockBooking()];
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll(faker.string.uuid(), Role.STUDENT);

      expect(result).toEqual(bookings);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ studentId: expect.any(String) }),
        }),
      );
    });

    it('should return all bookings for admin', async () => {
      const bookings = [mockBooking(), mockBooking(), mockBooking()];
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll(faker.string.uuid(), Role.ADMIN);

      expect(result).toEqual(bookings);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
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
