import { NestFactory } from '@nestjs/core';
import { StoryModule } from './story.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StoryModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'story_queue'
      }
    }
  );
  await app.listen();
}
bootstrap();
