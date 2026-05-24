import type { Prisma } from '@prisma/client';

export type ConversationWithDetails = Prisma.ConversationGetPayload<{
  include: {
    student: { select: { id: true; profile: true } };
    tutor: { select: { id: true; profile: true } };
    messages: {
      where: { deletedAt: null };
      orderBy: { createdAt: 'desc' };
      take: 1;
    };
  };
}>;
