import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      message: 'After-Meet API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
