import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ValidationPipe } from '@nestjs/common';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  app.enableCors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  });

  app.use(cookieParser())
  app.use(bodyParser.json({ limit: '3mb' }));
  app.use(bodyParser.urlencoded({ limit: '3mb', extended: true }));

  await app.listen(process.env.port ?? 3333);
}
bootstrap();
