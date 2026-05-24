import type { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}

export interface SendEmailDto {
  to: string;
  subject: string;
  body: string;
}
