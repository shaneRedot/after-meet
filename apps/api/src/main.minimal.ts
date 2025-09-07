import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.minimal';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
  console.log('🚀 Minimal API running on http://localhost:3001');
}

bootstrap();
