import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import type { INestApplicationContext } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';
import type { Env } from './config/env.validation';

export class CorsIoAdapter extends IoAdapter {
  private readonly allowedOrigin: string;

  constructor(app: INestApplicationContext) {
    super(app);
    const configService = app.get(ConfigService<Env, true>);
    this.allowedOrigin = configService.get('FRONTEND_URL', { infer: true });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
  override createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.allowedOrigin, credentials: true },
    });
  }
}
