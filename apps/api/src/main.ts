import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Global Validation Pipe ─────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ─── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: [
      process.env.CONSUMER_URL ?? 'http://localhost:3000',
      process.env.MERCHANT_URL ?? 'http://localhost:3002',
    ],
    credentials: true,
  });

  // ─── Global Prefix ──────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Spotly API running on http://localhost:${port}/api`);
}

bootstrap();
