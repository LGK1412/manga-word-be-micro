import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
   const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      UserModule,
      {
        transport: Transport.NATS,
        options:{
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
          queue: 'user_queue'
        }
      }
    )
    await app.listen();
}
bootstrap();
