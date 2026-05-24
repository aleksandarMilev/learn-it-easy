import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [MessagingService, MessagingGateway],
  controllers: [MessagingController],
  exports: [MessagingService],
})
export class MessagingModule {}
