import type { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

export const getRedisConfig = (configService: ConfigService): RedisOptions => ({
  host: configService.get<string>('app.redis.host'),
  port: configService.get<number>('app.redis.port'),
  password: configService.get<string>('app.redis.password') || undefined,
  maxRetriesPerRequest: null, // required by BullMQ
  lazyConnect: true,
});
