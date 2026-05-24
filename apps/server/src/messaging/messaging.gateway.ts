import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import type { Env } from '../config/env.validation';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token as string | undefined;
      if (!token) throw new WsException('Unauthorized');

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
      });

      client.data = { userId: payload.sub };
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ): Promise<void> {
    await client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  @UsePipes(new ValidationPipe())
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ): Promise<void> {
    const userId = client.data.userId as string;
    const message = await this.messagingService.sendMessage(userId, dto);

    this.server
      .to(`conversation:${dto.conversationId}`)
      .emit('receiveMessage', message);
  }
}
