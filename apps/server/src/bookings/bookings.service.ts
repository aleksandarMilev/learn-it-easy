import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBookingDto } from './dto/create-booking.dto';
import type { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus, Prisma, Role, type Booking } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingWithRelations } from './types/booking-with-relations.type';
import { BookingWithFullRelations } from './types/booking-with-full-relations.type';
import { CursorPaginationDto } from '../common/dto/cursor-pagination.dto';
import type { PaginatedResult } from '../common/types/paginated-result.type';

const SERIALIZATION_FAILURE_CODE = 'P2034';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    studentId: string,
    dto: CreateBookingDto,
  ): Promise<BookingWithRelations> {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id: dto.tutorId, isApproved: true, deletedAt: null },
      include: { user: { select: { id: true, profile: true } } },
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

    let booking: BookingWithRelations;

    try {
      booking = await this.prisma.$transaction(
        async (transaction) => {
          await this.#checkConflict(
            transaction,
            dto.tutorId,
            startTime,
            endTime,
          );

          return transaction.booking.create({
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
              student: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === SERIALIZATION_FAILURE_CODE
      ) {
        throw new BadRequestException(
          'Tutor is not available for the selected time slot',
        );
      }

      throw error;
    }

    const studentProfile = booking.student.profile;
    const studentName = studentProfile
      ? `${studentProfile.firstName} ${studentProfile.lastName}`
      : 'A student';

    await this.notificationsService.notifyBookingCreated(
      tutor.user.id,
      studentName,
      dto.subject,
    );

    return booking;
  }

  async findAll(
    userId: string,
    role: Role,
    query: CursorPaginationDto,
  ): Promise<PaginatedResult<BookingWithRelations>> {
    const take = query.take;
    const where =
      role === Role.STUDENT
        ? { studentId: userId, deletedAt: null }
        : role === Role.TUTOR
          ? { tutor: { userId }, deletedAt: null }
          : { deletedAt: null };

    const items = await this.prisma.booking.findMany({
      where,
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        tutor: { select: { id: true, subjects: true, hourlyRate: true } },
        student: {
          select: {
            id: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
    });

    const hasNextPage = items.length > take;
    const data = hasNextPage ? items.slice(0, take) : items;
    const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null;

    return { data, nextCursor };
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
      include: {
        tutor: { include: { user: { select: { id: true, profile: true } } } },
        student: { select: { id: true, profile: true } },
      },
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

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
    });

    const tutorProfile = booking.tutor.user.profile;
    const tutorName = tutorProfile
      ? `${tutorProfile.firstName} ${tutorProfile.lastName}`
      : 'Your tutor';

    if (dto.status === BookingStatus.CONFIRMED) {
      await this.notificationsService.notifyBookingConfirmed(
        booking.studentId,
        tutorName,
        booking.subject,
      );
    }

    if (dto.status === BookingStatus.CANCELLED) {
      const otherUserId = isStudent ? booking.tutor.userId : booking.studentId;
      await this.notificationsService.notifyBookingCancelled(
        otherUserId,
        booking.subject,
      );
    }

    return updated;
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

  async #checkConflict(
    transaction: Pick<PrismaService, 'booking'>,
    tutorId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    const conflict = await transaction.booking.findFirst({
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
