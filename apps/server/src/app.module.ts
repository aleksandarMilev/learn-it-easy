import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BookingsModule } from './bookings/bookings.module';
import { TutorsModule } from './tutors/tutors.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BookingsModule,
    TutorsModule,
    ReviewsModule,
    MessagingModule,
    NotificationsModule,
  ],
})
export class AppModule {}
