import type { Prisma } from '@prisma/client';

export type ConversationWithDetails = Prisma.ConversationGetPayload<{
  include: {
    student: {
      select: {
        id: true;
        profile: {
          select: { firstName: true; lastName: true; avatarUrl: true };
        };
      };
    };
    tutor: {
      select: {
        id: true;
        profile: {
          select: { firstName: true; lastName: true; avatarUrl: true };
        };
      };
    };
    messages: {
      where: { deletedAt: null };
      orderBy: { createdAt: 'desc' };
      take: 1;
    };
  };
}>;
