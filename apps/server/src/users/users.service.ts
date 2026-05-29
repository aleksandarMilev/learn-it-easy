/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const DEFAULT_AVATAR_URL = '/uploads/avatars/default-avatar.svg';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.profile.update({
      where: { userId },
      data: dto,
      select: {
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
      },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });

    return this.findMe(userId);
  }

  async removeAvatar(userId: string) {
    await this.prisma.profile.update({
      where: { userId },
      data: { avatarUrl: DEFAULT_AVATAR_URL },
    });

    return this.findMe(userId);
  }
}
