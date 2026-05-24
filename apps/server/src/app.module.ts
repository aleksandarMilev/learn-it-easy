import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
