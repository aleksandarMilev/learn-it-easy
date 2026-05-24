import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TutorsService } from './tutors.service';
import { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Role, type Availability, type TutorProfile } from '@prisma/client';
import { TutorWithUser } from './types/tutor-with-user.type';

@ApiTags('tutors')
@Controller('tutors')
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Post('profile')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Create tutor profile' })
  createProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTutorProfileDto,
  ): Promise<TutorProfile> {
    return this.tutorsService.createProfile(user.sub, dto);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Update tutor profile' })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTutorProfileDto,
  ): Promise<TutorProfile> {
    return this.tutorsService.updateProfile(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all approved tutors' })
  findAll(): Promise<TutorProfile[]> {
    return this.tutorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tutor by id' })
  findOne(@Param('id') id: string): Promise<TutorWithUser> {
    return this.tutorsService.findOne(id);
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve a tutor (admin only)' })
  approve(@Param('id') id: string): Promise<TutorProfile> {
    return this.tutorsService.approve(id);
  }

  @Post('availability')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Set tutor availability' })
  createAvailability(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAvailabilityDto,
  ): Promise<Availability> {
    return this.tutorsService.createAvailability(user.sub, dto);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get tutor availability' })
  getAvailability(@Param('id') id: string): Promise<Availability[]> {
    return this.tutorsService.getAvailability(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @ApiOperation({ summary: 'Soft delete tutor profile' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<TutorProfile> {
    return this.tutorsService.softDelete(
      user.sub,
      id,
      user.role === Role.ADMIN,
    );
  }
}
