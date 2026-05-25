import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { type Conversation, type Message } from '@prisma/client';
import { ConversationWithDetails } from './types/conversation-with-details.type';
import { MessageWithSender } from './types/message-with-sender.type';

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('messages')
export class MessagingController {
  constructor(private readonly service: MessagingService) {}

  @Post('conversation')
  @ApiOperation({ summary: 'Start a conversation with a tutor' })
  createConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.service.createConversation(user.sub, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  findConversations(
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationWithDetails[]> {
    return this.service.findConversations(user.sub);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  findMessages(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<MessageWithSender[]> {
    return this.service.findMessages(id, user.sub);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Soft delete a message' })
  deleteMessage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Message> {
    return this.service.softDeleteMessage(id, user.sub);
  }
}
