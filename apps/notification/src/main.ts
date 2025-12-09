import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'notification_queue'
      }
    }
  )
  await app.listen();
}
bootstrap();
