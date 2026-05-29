import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { Role } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mockUser = () => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  role: Role.STUDENT,
  createdAt: new Date(),
  profile: {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    bio: null,
  },
});

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  profile: {
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findMe', () => {
    it('should return the current user with profile', async () => {
      const user = mockUser();
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findMe(user.id);

      expect(result).toEqual(user);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findMe(faker.string.uuid())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const user = mockUser();
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findById(user.id);

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findById(faker.string.uuid())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return only non-deleted users', async () => {
      const users = [mockUser(), mockUser()];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });
  });

  describe('updateMe', () => {
    it('should update and return the profile', async () => {
      const user = mockUser();
      const dto = { firstName: 'Updated', lastName: 'Name' };
      const updatedProfile = { ...user.profile, ...dto };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.profile.update.mockResolvedValue(updatedProfile);

      const result = await service.updateMe(user.id, dto);

      expect(result).toEqual(updatedProfile);
      expect(mockPrismaService.profile.update).toHaveBeenCalledWith({
        where: { userId: user.id },
        data: dto,
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMe(faker.string.uuid(), { firstName: 'John' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
