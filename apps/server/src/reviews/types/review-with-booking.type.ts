import type { Prisma } from '@prisma/client';

export type ReviewWithBooking = Prisma.ReviewGetPayload<{
  include: { booking: { select: { studentId: true; tutorId: true } } };
}>;
