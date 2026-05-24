import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CreateTutorProfileDto {
  @ApiProperty({ example: ['Mathematics', 'Physics'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subjects!: string[];

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  hourlyRate!: number;

  @ApiPropertyOptional({ example: 'Experienced tutor with 5 years...' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
