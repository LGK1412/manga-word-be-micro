import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.NATS,
      options:{
        servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
        queue: 'auth_queue'
      }
    }
  )
  await app.listen();
}
bootstrap();
