import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TutorsService } from './tutors.service';
import { PrismaService } from '../prisma/prisma.service';
import { faker } from '@faker-js/faker';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockTutorProfile = (overrides = {}) => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  subjects: ['Mathematics'],
  hourlyRate: 50,
  bio: null,
  isApproved: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockAvailability = (tutorId: string) => ({
  id: faker.string.uuid(),
  tutorId,
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '17:00',
  createdAt: new Date(),
});

const mockPrismaService = {
  tutorProfile: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  availability: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

describe('TutorsService', () => {
  let service: TutorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutorsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TutorsService>(TutorsService);
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    const userId = faker.string.uuid();
    const dto = { subjects: ['Mathematics'], hourlyRate: 50, bio: undefined };

    it('should create a tutor profile', async () => {
      const profile = mockTutorProfile({ userId });
      mockPrismaService.tutorProfile.findUnique.mockResolvedValue(null);
      mockPrismaService.tutorProfile.create.mockResolvedValue(profile);

      const result = await service.createProfile(userId, dto);

      expect(result).toEqual(profile);
      expect(mockPrismaService.tutorProfile.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockPrismaService.tutorProfile.findUnique.mockResolvedValue(
        mockTutorProfile({ userId }),
      );

      await expect(service.createProfile(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update a tutor profile', async () => {
      const profile = mockTutorProfile();
      const updated = { ...profile, bio: 'Updated bio' };
      mockPrismaService.tutorProfile.findUnique.mockResolvedValue(profile);
      mockPrismaService.tutorProfile.update.mockResolvedValue(updated);

      const result = await service.updateProfile(profile.userId, {
        bio: 'Updated bio',
      });

      expect(result.bio).toBe('Updated bio');
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockPrismaService.tutorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(faker.string.uuid(), { bio: 'bio' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all approved tutors', async () => {
      const tutors = [mockTutorProfile({ isApproved: true })];
      mockPrismaService.tutorProfile.findMany.mockResolvedValue(tutors);

      const result = await service.findAll();

      expect(result).toEqual(tutors);
      expect(mockPrismaService.tutorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isApproved: true, deletedAt: null },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a tutor by id', async () => {
      const tutor = mockTutorProfile({ isApproved: true });
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(tutor);

      const result = await service.findOne(tutor.id);

      expect(result).toEqual(tutor);
    });

    it('should throw NotFoundException if tutor not found', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(null);

      await expect(service.findOne(faker.string.uuid())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('should approve a tutor', async () => {
      const tutor = mockTutorProfile();
      const approved = { ...tutor, isApproved: true };
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(tutor);
      mockPrismaService.tutorProfile.update.mockResolvedValue(approved);

      const result = await service.approve(tutor.id);

      expect(result.isApproved).toBe(true);
    });

    it('should throw NotFoundException if tutor not found', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(null);

      await expect(service.approve(faker.string.uuid())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createAvailability', () => {
    const dto = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' };

    it('should create availability for a tutor', async () => {
      const profile = mockTutorProfile();
      const availability = mockAvailability(profile.id);
      mockPrismaService.tutorProfile.findUnique.mockResolvedValue(profile);
      mockPrismaService.availability.findFirst.mockResolvedValue(null);
      mockPrismaService.availability.create.mockResolvedValue(availability);

      const result = await service.createAvailability(profile.userId, dto);

      expect(result).toEqual(availability);
    });

    it('should throw NotFoundException if tutor profile not found', async () => {
      mockPrismaService.tutorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.createAvailability(faker.string.uuid(), dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if startTime >= endTime', async () => {
      mockPrismaService.tutorProfile.findUnique.mockResolvedValue(
        mockTutorProfile(),
      );

      await expect(
        service.createAvailability(faker.string.uuid(), {
          dayOfWeek: 1,
          startTime: '17:00',
          endTime: '09:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if availability already exists for day', async () => {
      const profile = mockTutorProfile();
      mockPrismaService.tutorProfile.findUnique.mockResolvedValue(profile);
      mockPrismaService.availability.findFirst.mockResolvedValue(
        mockAvailability(profile.id),
      );

      await expect(
        service.createAvailability(profile.userId, dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a tutor profile by owner', async () => {
      const tutor = mockTutorProfile();
      const deleted = { ...tutor, deletedAt: new Date() };
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(tutor);
      mockPrismaService.tutorProfile.update.mockResolvedValue(deleted);

      const result = await service.softDelete(tutor.userId, tutor.id, false);

      expect(result.deletedAt).not.toBeNull();
    });

    it('should allow admin to soft delete any tutor', async () => {
      const tutor = mockTutorProfile();
      const deleted = { ...tutor, deletedAt: new Date() };
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(tutor);
      mockPrismaService.tutorProfile.update.mockResolvedValue(deleted);

      const result = await service.softDelete(
        faker.string.uuid(),
        tutor.id,
        true,
      );

      expect(result.deletedAt).not.toBeNull();
    });

    it('should throw ForbiddenException if not owner or admin', async () => {
      const tutor = mockTutorProfile();
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(tutor);

      await expect(
        service.softDelete(faker.string.uuid(), tutor.id, false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if tutor not found', async () => {
      mockPrismaService.tutorProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete(faker.string.uuid(), faker.string.uuid(), false),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
