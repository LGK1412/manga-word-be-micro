import { Module } from '@nestjs/common';
import { StyleController } from './style.controller';
import { StyleService } from './style.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Style, StyleSchema } from 'libs/Schema/style/style.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
    }),

    MongooseModule.forFeature([{
      name: Style.name,
      schema: StyleSchema
    }])
  ],
  controllers: [StyleController],
  providers: [StyleService],
})
export class StyleModule { }
