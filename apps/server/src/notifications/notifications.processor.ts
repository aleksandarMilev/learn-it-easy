import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATIONS_QUEUE, NotificationJobs } from './notifications.queue';
import type {
  CreateNotificationDto,
  SendEmailDto,
} from './dto/create-notification.dto';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case NotificationJobs.CREATE_IN_APP:
        await this.handleCreateInApp(job.data as CreateNotificationDto);
        break;
      case NotificationJobs.SEND_EMAIL:
        await this.#handleSendEmail(job.data as SendEmailDto);
        break;
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleCreateInApp(data: CreateNotificationDto): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
      },
    });

    this.logger.log(`In-app notification created for user ${data.userId}`);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async #handleSendEmail(data: SendEmailDto): Promise<void> {
    // TODO:Implement with nodemailer
    this.logger.log(`Email sent to ${data.to}: ${data.subject}`);
  }
}
