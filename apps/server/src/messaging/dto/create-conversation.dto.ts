import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ example: 'uuid-of-tutor-user-id' })
  @IsUUID()
  tutorUserId!: string;
}
