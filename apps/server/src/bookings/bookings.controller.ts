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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Role, type Booking } from '@prisma/client';
import { BookingWithRelations } from './types/booking-with-relations.type';
import { BookingWithFullRelations } from './types/booking-with-full-relations.type';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingWithRelations> {
    return this.bookingsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings for current user' })
  findAll(@CurrentUser() user: JwtPayload): Promise<BookingWithRelations[]> {
    return this.bookingsService.findAll(user.sub, user.role as Role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingWithFullRelations> {
    return this.bookingsService.findOne(id, user.sub, user.role as Role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBookingDto,
  ): Promise<Booking> {
    return this.bookingsService.updateStatus(
      id,
      user.sub,
      user.role as Role,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a booking' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Booking> {
    return this.bookingsService.softDelete(id, user.sub, user.role as Role);
  }
}
