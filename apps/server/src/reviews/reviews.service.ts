import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateReviewDto } from './dto/create-review.dto';
import type { UpdateReviewDto } from './dto/update-review.dto';
import { BookingStatus, type Review } from '@prisma/client';
import { ReviewWithBooking } from './types/review-with-booking.type';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: string, dto: CreateReviewDto): Promise<Review> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: dto.bookingId,
        studentId,
        status: BookingStatus.COMPLETED,
        deletedAt: null,
      },
    });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found, not completed, or not yours',
      );
    }

    const existing = await this.prisma.review.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existing) {
      throw new BadRequestException('Review already exists for this booking');
    }

    return this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async findByTutor(tutorId: string): Promise<ReviewWithBooking[]> {
    const tutor = await this.prisma.tutorProfile.findFirst({
      where: { id: tutorId, deletedAt: null },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return this.prisma.review.findMany({
      where: {
        deletedAt: null,
        booking: { tutorId },
      },
      include: {
        booking: { select: { studentId: true, tutorId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: string,
    studentId: string,
    dto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      include: { booking: { select: { studentId: true } } },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.booking.studentId !== studentId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async softDelete(
    id: string,
    studentId: string,
    isAdmin: boolean,
  ): Promise<Review> {
    const review = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      include: { booking: { select: { studentId: true } } },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.booking.studentId !== studentId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    return this.prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
