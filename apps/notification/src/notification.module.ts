import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from 'libs/Schema/notification/notification.schema';
import { firebaseAdminProvider } from './firebase-admin.provider';

@Module({
  imports: [
    ConfigModule.forRoot(),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
    }),

    MongooseModule.forFeature([
      {
        name: Notification.name,
        schema: NotificationSchema
      }
    ])
  ],
  controllers: [NotificationController],
  providers: [NotificationService, firebaseAdminProvider],
})
export class NotificationModule { }
