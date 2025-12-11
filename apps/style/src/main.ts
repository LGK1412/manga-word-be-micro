import { NestFactory } from '@nestjs/core';
import { StyleModule } from './style.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StyleModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'style_queue'
      }
    }
  );
  await app.listen();
}
bootstrap();
