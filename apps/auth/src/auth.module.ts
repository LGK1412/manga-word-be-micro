import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ===== Database Connection =====
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
    }),

    // ===== Mail Module =====
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: '"Mangaword" <no-reply@mangaword.com>',
        },
        template: {
          dir: join(__dirname, 'templates-mail-send'),
          adapter: new (
            require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter')
              .HandlebarsAdapter
          )(),
          options: { strict: true },
        },
      }),
    }),

    // ===== JWT =====
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '360d' }
    }),

    // ===== Services =====
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222']
        }
      }
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: OAuth2Client,
      useFactory: () => {
        return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      },
    },
  ],
})
export class AuthModule { }
