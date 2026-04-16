import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      status: 'online',
      message: 'Spotly API is running',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
