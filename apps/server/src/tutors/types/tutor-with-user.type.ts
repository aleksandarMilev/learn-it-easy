import type { Prisma } from '@prisma/client';

export type TutorWithUser = Prisma.TutorProfileGetPayload<{
  include: {
    user: { select: { id: true; profile: true } };
    availability: true;
  };
}>;
