import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBookingDto } from './dto/create-booking.dto';
import type { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus, Role, type Booking } from '@prisma/client';
import { BookingWithRelations } from './types/booking-with-relations.type';
import { BookingWithFullRelations } from './types/booking-with-full-relations.type';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    studentId: string,
    dto: CreateBookingDto,
  ): Promise<BookingWithRelations> {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id: dto.tutorId, isApproved: true, deletedAt: null },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found or not approved');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (startTime < new Date()) {
      throw new BadRequestException('Cannot book in the past');
    }

    await this.checkConflict(dto.tutorId, startTime, endTime);

    return this.prisma.booking.create({
      data: {
        studentId,
        tutorId: dto.tutorId,
        startTime,
        endTime,
        subject: dto.subject,
        notes: dto.notes,
      },
      include: {
        tutor: { select: { id: true, subjects: true, hourlyRate: true } },
        student: { select: { id: true, profile: true } },
      },
    });
  }

  findAll(userId: string, role: Role): Promise<BookingWithRelations[]> {
    const where =
      role === Role.STUDENT
        ? { studentId: userId, deletedAt: null }
        : role === Role.TUTOR
          ? { tutor: { userId }, deletedAt: null }
          : { deletedAt: null };

    return this.prisma.booking.findMany({
      where,
      include: {
        tutor: { select: { id: true, subjects: true, hourlyRate: true } },
        student: { select: { id: true, profile: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(
    id: string,
    userId: string,
    role: Role,
  ): Promise<BookingWithFullRelations> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, deletedAt: null },
      include: {
        tutor: {
          select: { id: true, userId: true, subjects: true, hourlyRate: true },
        },
        student: { select: { id: true, profile: true } },
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isStudent = booking.studentId === userId;
    const isTutor = booking.tutor.userId === userId;
    const isAdmin = role === Role.ADMIN;

    if (!isStudent && !isTutor && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    userId: string,
    role: Role,
    dto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, deletedAt: null },
      include: { tutor: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isTutor = booking.tutor.userId === userId;
    const isStudent = booking.studentId === userId;
    const isAdmin = role === Role.ADMIN;

    if (dto.status === BookingStatus.CONFIRMED && !isTutor && !isAdmin) {
      throw new ForbiddenException('Only tutor can confirm a booking');
    }

    if (
      dto.status === BookingStatus.CANCELLED &&
      !isStudent &&
      !isTutor &&
      !isAdmin
    ) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async softDelete(id: string, userId: string, role: Role): Promise<Booking> {
    const booking = await this.prisma.booking.findFirst({
      where: { id, deletedAt: null },
      include: { tutor: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isStudent = booking.studentId === userId;
    const isAdmin = role === Role.ADMIN;

    if (!isStudent && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async checkConflict(
    tutorId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    const conflict = await this.prisma.booking.findFirst({
      where: {
        tutorId,
        deletedAt: null,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    });

    if (conflict) {
      throw new BadRequestException(
        'Tutor is not available for the selected time slot',
      );
    }
  }
}
