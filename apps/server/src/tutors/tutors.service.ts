import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
import type { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import type { CreateAvailabilityDto } from './dto/create-availability.dto';
import { type Availability, type TutorProfile } from '@prisma/client';
import { TutorWithUser } from './types/tutor-with-user.type';

@Injectable()
export class TutorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(
    userId: string,
    dto: CreateTutorProfileDto,
  ): Promise<TutorProfile> {
    const existing = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('Tutor profile already exists');
    }

    return this.prisma.tutorProfile.create({
      data: {
        userId,
        subjects: dto.subjects,
        hourlyRate: dto.hourlyRate,
        bio: dto.bio,
      },
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateTutorProfileDto,
  ): Promise<TutorProfile> {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return this.prisma.tutorProfile.update({
      where: { userId },
      data: {
        subjects: dto.subjects,
        hourlyRate: dto.hourlyRate,
        bio: dto.bio,
      },
    });
  }

  findAll(): Promise<TutorProfile[]> {
    return this.prisma.tutorProfile.findMany({
      where: { isApproved: true, deletedAt: null },
      include: {
        user: { select: { id: true, profile: true } },
        availability: true,
      },
    });
  }

  async findOne(id: string): Promise<TutorWithUser> {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id, isApproved: true, deletedAt: null },
      include: {
        user: { select: { id: true, profile: true } },
        availability: true,
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return tutor;
  }

  async approve(id: string): Promise<TutorProfile> {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id, deletedAt: null },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return this.prisma.tutorProfile.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async createAvailability(
    userId: string,
    dto: CreateAvailabilityDto,
  ): Promise<Availability> {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const existing = await this.prisma.availability.findFirst({
      where: {
        tutorId: profile.id,
        dayOfWeek: dto.dayOfWeek,
      },
    });

    if (existing) {
      throw new ConflictException('Availability for this day already exists');
    }

    return this.prisma.availability.create({
      data: {
        tutorId: profile.id,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async getAvailability(tutorId: string): Promise<Availability[]> {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id: tutorId, deletedAt: null },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return this.prisma.availability.findMany({
      where: { tutorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async softDelete(
    userId: string,
    id: string,
    isAdmin: boolean,
  ): Promise<TutorProfile> {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id, deletedAt: null },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    if (tutor.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.tutorProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
