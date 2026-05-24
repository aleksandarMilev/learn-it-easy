import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Env } from '../config/env.validation';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        role: dto.role,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            avatarUrl: '/uploads/avatars/default-avatar.svg',
          },
        },
      },
    });

    return this.#generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.#generateTokens(user.id, user.email, user.role);
  }

  async refresh(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { token } });
    return this.#generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );
  }

  async logout(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  async #generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = randomUUID();
    const payload = { sub: userId, email, role, jti };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', {
        infer: true,
      }),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', {
        infer: true,
      }),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
