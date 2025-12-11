import { NestFactory } from '@nestjs/core';
import { GenreModule } from './genre.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GenreModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'genre_queue'
      }
    }
  );
  await app.listen();
}
bootstrap();
