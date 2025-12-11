import { BadRequestException, Body, Controller, Get, Inject, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { ChangePasswordDto } from 'libs/Dto/auth/change-password.dto';
import { EmailDto } from 'libs/Dto/auth/email.dto';
import { GoogleLoginDto } from 'libs/Dto/auth/google-login.dto';
import { LoginDto } from 'libs/Dto/auth/login.dto';
import { PassordRecoveryDto } from 'libs/Dto/auth/password-recovery.dto';
import { RegisterDto } from 'libs/Dto/auth/register.dto';
import { VerifyEmailDto } from 'libs/Dto/auth/verifyEmail.dto';
import { CreateGenreDto } from 'libs/Dto/genre/create-genre.Schema';
import { UpdateGenreDto } from 'libs/Dto/genre/update-genre.Schema';
import { NotiDto } from 'libs/Dto/notification/notiId.dto';
import { sendNotificationDto } from 'libs/Dto/notification/sendNoti.dto';
import { CreateStyleDto } from 'libs/Dto/style/create-style.dto';
import { AccessTokenAdminGuard } from 'libs/Guard/access-token-admin.guard';
import { AccessTokenGuard } from 'libs/Guard/access-token.guard';
import { lastValueFrom } from 'rxjs';

@Controller()
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private auth: ClientProxy,
    @Inject('USER_SERVICE') private user: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notification: ClientProxy,
    @Inject('STORY_SERVICE') private story: ClientProxy,
    @Inject('GENRE_SERVICE') private genre: ClientProxy,
    @Inject('STYLE_SERVICE') private style: ClientProxy,
  ) { }

  // ========== Authentication routes ==========
  @Post('/auth/register')
  async register(@Body() userData: RegisterDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'register' }, userData));

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Registration failed');
    } else {
      return { success: true, message: res.message || 'Registeration successfully' };
    }
  }

  @Post('/auth/send-verification-email')
  async sendVerificationEmail(@Body() data: EmailDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'send_verification_email' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Send verification email failed');
    } else {
      return { success: true, message: res.message || 'Send verification email successfully' };
    }
  }

  @Post('/auth/verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'verify_email' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Verification email failed');
    } else {
      return { success: true, message: res.message || 'Verification email successfully' };
    }
  }

  @Post('/auth/login')
  async login(@Body() data: LoginDto, @Res({ passthrough: true }) response: Response) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'login' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Login failed');
    } else {

      response.cookie('access_token', res.accessToken, {
        httpOnly: true,
        maxAge: 360 * 24 * 60 * 60 * 1000,
        secure: false,
        sameSite: "strict",
      });

      return { success: true, message: res.message || 'Login successfully', accessToken: res.accessToken, tokenPayload: res.tokenPayload };
    }
  }

  @Post('/auth/logout')
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 0,
    })

    return { success: true }
  }

  @Post('/auth/send-password-recovery-email')
  async sendPasswordRecovery(@Body() data: EmailDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'send-password-recovery-email' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Send recovery email failed');
    } else {
      return { success: true, message: res.message || 'Send recovery email successfully' };
    }
  }

  @Post('/auth/verify-password-recovery')
  async verificationRecoveryPassword(@Body() data: PassordRecoveryDto) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'verification_forgot_password' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Recovery password failed');
    } else {
      return { success: true, message: res.message || 'Recovery password successfully' };
    }
  }

  @UseGuards(AccessTokenGuard)
  @Post('/auth/change-password')
  async changePassword(@Body() data: ChangePasswordDto, @Req() req: Request) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'change_password' }, { password: data.password, user: req?.user }))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Change password failed');
    } else {
      return { success: true, message: res.message || 'Change password successfully' };
    }
  }

  @Post('/auth/google-login')
  async googleLogin(@Body() data: GoogleLoginDto, @Res({ passthrough: true }) response: Response) {
    const res = await lastValueFrom(this.auth.send({ cmd: 'google-login' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Login with Google failed');
    } else {
      return { success: true, message: res.message || 'Login with Google successfully' };
    }
  }

  // ========== Story routes ==========

  @Post('/story/create-story/:author_id')
  async createStory(@Body() data: any, @Req() req: Request) {

  }

  // ========== Genre routes ==========
  @UseGuards(AccessTokenAdminGuard)
  @Post('/genre/create')
  async createGenre(@Body() data: CreateGenreDto, @Req() req: Request) {
    const res = await lastValueFrom(this.genre.send({ cmd: 'create-genre' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Create genre failed');
    } else {
      return { success: true, message: res.message || 'Create genre successfully' };
    }
  }

  @UseGuards(AccessTokenAdminGuard)
  @Patch('/genre/update/:id')
  async updateGenre(@Body() data: UpdateGenreDto, @Req() req: Request, @Param('id') id: string) {
    const res = await lastValueFrom(this.genre.send({ cmd: 'update-genre' }, { id, ...data }))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Updated genre failed');
    } else {
      return { success: true, message: res.message || 'Updated genre successfully' };
    }
  }
  // ========== Style routes ==========

  @UseGuards(AccessTokenAdminGuard)
  @Post('/style/create')
  async createStyle(@Body() data: CreateStyleDto) {
    const res = await lastValueFrom(this.style.send({ cmd: 'create-style' }, data))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Create style failed');
    } else {
      return { success: true, message: res.message || 'Create style successfully' };
    }
  }

  @UseGuards(AccessTokenAdminGuard)
  @Patch('/style/update/:id')
  async updateStyle(@Body() data: CreateStyleDto, @Param('id') id: string) {
    const res = await lastValueFrom(this.style.send({ cmd: 'update-style' }, { id, ...data }))

    if (res?.success !== true) {
      throw new BadRequestException(res.message || 'Update style failed');
    } else {
      return { success: true, message: res.message || 'Update style successfully' };
    }
  }
}
