import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ImageValidatorService } from './services/image-validator.service';

@Module({
  providers: [UsersService, ImageValidatorService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
