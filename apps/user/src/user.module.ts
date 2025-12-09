import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'libs/Schema/user/user.schema';


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

    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }]),
    
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
