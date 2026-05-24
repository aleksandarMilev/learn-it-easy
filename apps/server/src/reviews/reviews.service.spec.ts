import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockReview = (overrides = {}) => ({
  id: faker.string.uuid(),
  bookingId: faker.string.uuid(),
  rating: 5,
  comment: 'Great tutor!',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  booking: {
    studentId: faker.string.uuid(),
    tutorId: faker.string.uuid(),
  },
  ...overrides,
});

const mockPrismaService = {
  booking: { findFirst: jest.fn() },
  review: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  tutorProfile: { findFirst: jest.fn() },
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const studentId = faker.string.uuid();
    const dto = {
      bookingId: faker.string.uuid(),
      rating: 5,
      comment: 'Excellent!',
    };

    it('should create a review for a completed booking', async () => {
      const review = mockReview({
        booking: { studentId, tutorId: faker.string.uuid() },
      });
      mockPrismaService.booking.findFirst.mockResolvedValue({
        id: dto.bookingId,
        studentId,
        status: BookingStatus.COMPLETED,
      });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue(review);

      const result = await service.create(studentId, dto);

      expect(result).toEqual(review);
      expect(mockPrismaService.review.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if booking not found or not completed', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue(null);

      await expect(service.create(studentId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if review already exists', async () => {
      mockPrismaService.booking.findFirst.mockResolvedValue({
        id: dto.bookingId,
        studentId,
        status: BookingStatus.COMPLETED,
      });
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview());

      await expect(service.create(studentId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByTutor', () => {
    it('should return reviews for a tutor', async () => {
      const tutorId = faker.string.uuid();
      const reviews = [mockReview(), mockReview()];
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue({
        id: tutorId,
      });
      mockPrismaService.review.findMany.mockResolvedValue(reviews);

      const result = await service.findByTutor(tutorId);

      expect(result).toEqual(reviews);
      expect(mockPrismaService.review.findMany).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if tutor not found', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(null);

      await expect(service.findByTutor(faker.string.uuid())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a review', async () => {
      const studentId = faker.string.uuid();
      const review = mockReview({
        booking: { studentId, tutorId: faker.string.uuid() },
      });
      const updated = { ...review, rating: 4, comment: 'Updated' };
      mockPrismaService.review.findFirst.mockResolvedValue(review);
      mockPrismaService.review.update.mockResolvedValue(updated);

      const result = await service.update(review.id, studentId, {
        rating: 4,
        comment: 'Updated',
      });

      expect(result.rating).toBe(4);
    });

    it('should throw NotFoundException if review not found', async () => {
      mockPrismaService.review.findFirst.mockResolvedValue(null);

      await expect(
        service.update(faker.string.uuid(), faker.string.uuid(), { rating: 4 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not the review owner', async () => {
      const review = mockReview();
      mockPrismaService.review.findFirst.mockResolvedValue(review);

      await expect(
        service.update(review.id, faker.string.uuid(), { rating: 3 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a review by owner', async () => {
      const studentId = faker.string.uuid();
      const review = mockReview({
        booking: { studentId, tutorId: faker.string.uuid() },
      });
      const deleted = { ...review, deletedAt: new Date() };
      mockPrismaService.review.findFirst.mockResolvedValue(review);
      mockPrismaService.review.update.mockResolvedValue(deleted);

      const result = await service.softDelete(review.id, studentId, false);

      expect(result.deletedAt).not.toBeNull();
    });

    it('should allow admin to delete any review', async () => {
      const review = mockReview();
      const deleted = { ...review, deletedAt: new Date() };
      mockPrismaService.review.findFirst.mockResolvedValue(review);
      mockPrismaService.review.update.mockResolvedValue(deleted);

      const result = await service.softDelete(
        review.id,
        faker.string.uuid(),
        true,
      );

      expect(result.deletedAt).not.toBeNull();
    });

    it('should throw ForbiddenException if not owner or admin', async () => {
      const review = mockReview();
      mockPrismaService.review.findFirst.mockResolvedValue(review);

      await expect(
        service.softDelete(review.id, faker.string.uuid(), false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if review not found', async () => {
      mockPrismaService.review.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete(faker.string.uuid(), faker.string.uuid(), false),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
