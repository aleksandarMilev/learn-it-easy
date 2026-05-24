import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './env.validation';

const envFile =
  process.env.NODE_ENV === 'test' ? '../../.env.ci' : '../../.env.dev';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFile,
      validate: (config) => envSchema.parse(config),
    }),
  ],
})
export class ConfigModule {}
