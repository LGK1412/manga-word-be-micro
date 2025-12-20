import { NestFactory } from '@nestjs/core';
import { ChapterModule } from './chapter.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ChapterModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'chapter_queue'
      }
    }
  );
  await app.listen();
}
bootstrap();
