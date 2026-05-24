import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class UpdateTutorProfileDto {
  @ApiPropertyOptional({ example: ['Mathematics', 'Physics'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subjects?: string[];

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 'Experienced tutor with 5 years...' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
