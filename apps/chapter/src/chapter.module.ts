import { Module } from '@nestjs/common';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Chapter, ChapterSchema } from 'libs/Schema/chapter/chapter.schema';
import { ImageChapter, ImageChapterSchema } from 'libs/Schema/chapter/image-chapter.schema';
import { TextChapter, TextChapterSchema } from 'libs/Schema/chapter/text-chapter.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      })
    }),

    MongooseModule.forFeature([
      {
        name: Chapter.name,
        schema: ChapterSchema
      },
      {
        name: ImageChapter.name,
        schema: ImageChapterSchema
      },
      {
        name: TextChapter.name,
        schema: TextChapterSchema
      }
    ]),

    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222']
        }
      },
       {
        name: 'STORY_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL ?? 'nats://localhost:4222']
        }
      }
    ]),
  ],
  controllers: [ChapterController],
  providers: [ChapterService],
})
export class ChapterModule { }
