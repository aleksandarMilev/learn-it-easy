import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CursorPaginationDto } from '../common/dto/cursor-pagination.dto';
import type { PaginatedResult } from '../common/types/paginated-result.type';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingWithRelations> {
    return this.service.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get bookings for current user (cursor-paginated)' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: CursorPaginationDto,
  ): Promise<PaginatedResult<BookingWithRelations>> {
    return this.service.findAll(user.sub, user.role as Role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BookingWithFullRelations> {
    return this.service.findOne(id, user.sub, user.role as Role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBookingDto,
  ): Promise<Booking> {
    return this.service.updateStatus(id, user.sub, user.role as Role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a booking' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Booking> {
    return this.service.softDelete(id, user.sub, user.role as Role);
  }
}
