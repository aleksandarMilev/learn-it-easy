import type { Prisma } from '@prisma/client';

export type BookingWithFullRelations = Prisma.BookingGetPayload<{
  include: {
    tutor: {
      select: { id: true; userId: true; subjects: true; hourlyRate: true };
    };
    student: { select: { id: true; profile: true } };
    review: true;
  };
}>;
