import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
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
        'http://localhost:3003',
        process.env.MERCHANT_URL ?? 'http://localhost:3002',
      ],
      credentials: true,
    });

    // ─── Global Prefix ──────────────────────────────────────────────────────────
    app.setGlobalPrefix('api');

    const port = process.env.PORT ?? 3001;
    logger.log(`Attempting to listen on port ${port}...`);
    
    // Bind to 0.0.0.0 explicitly for Render
    await app.listen(port, '0.0.0.0');
    logger.log(`Spotly API running on http://0.0.0.0:${port}/api`);
  } catch (error) {
    logger.error('CRITICAL BOOTSTRAP ERROR:', error);
    console.error('Raw error object:', error);
    process.exit(1);
  }
}

bootstrap();
