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
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ConfigModule {}
