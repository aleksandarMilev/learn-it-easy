import type { Prisma } from '@prisma/client';

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    tutor: { select: { id: true; subjects: true; hourlyRate: true } };
    student: {
      select: {
        id: true;
        profile: {
          select: { firstName: true; lastName: true; avatarUrl: true };
        };
      };
    };
  };
}>;
