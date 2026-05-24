import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import type { Notification } from '@prisma/client';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  findAll(@CurrentUser() user: JwtPayload): Promise<Notification[]> {
    return this.notificationsService.findAll(user.sub);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.sub);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Notification> {
    return this.notificationsService.softDelete(id, user.sub);
  }
}
