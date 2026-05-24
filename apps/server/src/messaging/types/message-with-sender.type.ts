import type { Prisma } from '@prisma/client';

export type MessageWithSender = Prisma.MessageGetPayload<{
  include: { sender: { select: { id: true; profile: true } } };
}>;
