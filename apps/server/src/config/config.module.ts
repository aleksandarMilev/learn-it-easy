import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env.dev',
      validate: (config) => envSchema.parse(config),
    }),
  ],
})
export class ConfigModule {}
