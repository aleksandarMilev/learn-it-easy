import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-tutor-profile' })
  @IsUUID()
  tutorId!: string;

  @ApiProperty({ example: '2026-06-01T10:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-06-01T11:00:00.000Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  subject!: string;

  @ApiPropertyOptional({ example: 'Focus on calculus' })
  @IsOptional()
  @IsString()
  notes?: string;
}
