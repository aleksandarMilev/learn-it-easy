import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('mock-secret'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const dto = {
        email: faker.internet.email(),
        password: faker.internet.password({ length: 10 }),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: Role.STUDENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: faker.string.uuid(),
        email: dto.email,
        role: Role.STUDENT,
      });

      mockPrismaService.refreshToken.create.mockResolvedValue({});
      const result = await service.register(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto = {
        email: faker.internet.email(),
        password: faker.internet.password({ length: 10 }),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: Role.STUDENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: faker.string.uuid(),
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const password = faker.internet.password({ length: 10 });
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: Role.STUDENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: user.email, password });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: faker.internet.email(), password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: Role.STUDENT,
      });

      await expect(
        service.login({
          email: faker.internet.email(),
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      const stored = {
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          role: Role.STUDENT,
        },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(stored);
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('valid-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
      });
    });

    it('should throw UnauthorizedException if token not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
        user: {
          id: faker.string.uuid(),
          email: faker.internet.email(),
          role: Role.STUDENT,
        },
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete the refresh token', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({});

      await service.logout('some-token');

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-token' },
      });
    });
  });
});
