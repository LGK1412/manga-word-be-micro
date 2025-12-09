import { BadRequestException, Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { ChangePasswordDto } from 'libs/Dto/auth/change-password.dto';
import { EmailDto } from 'libs/Dto/auth/email.dto';
import { GoogleLoginDto } from 'libs/Dto/auth/google-login.dto';
import { LoginDto } from 'libs/Dto/auth/login.dto';
import { PassordRecoveryDto } from 'libs/Dto/auth/password-recovery.dto';
import { RegisterDto } from 'libs/Dto/auth/register.dto';
import { VerifyEmailDto } from 'libs/Dto/auth/verifyEmail.dto';
import { NotiDto } from 'libs/Dto/notification/notiId.dto';
import { sendNotificationDto } from 'libs/Dto/notification/sendNoti.dto';
import { JwtCookieGuard } from 'libs/Guard/jwt-cookie.guard';
import { lastValueFrom } from 'rxjs';

@Controller()
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private auth: ClientProxy,
    @Inject('USER_SERVICE') private user: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notification: ClientProxy
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

  @UseGuards(JwtCookieGuard)
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

  // ========== Notification routes ==========

  async sendNotification(pushNotification: sendNotificationDto) {
    return await lastValueFrom(this.notification.send({ cmd: 'push-noti' }, pushNotification));
  }

  // async getNotiForUser(data: NotiDto) {
  //   return await lastValueFrom(this.notification.send({ cmd: 'get-all-noti-for-user' }, data));
  // }

  // async getNotiForSender(data: NotiDto) {
  //   return await lastValueFrom(this.notification.send({ cmd: 'get-all-noti-for-sender' }, data));
  // }// bữa mới thêm vô

  // async markAsRead(id: string, user_id: string) {
  //   return await lastValueFrom(this.notification.send({ cmd: 'mark-as-read' }, { id, user_id }));
  // }

  // async markAllAsRead(user_id: string) {
  //   return await lastValueFrom(this.notification.send({ cmd: 'mark-all-as-read' }, { user_id }));
  // }

  // async deleteNoti(id: string, user_id: string) {
  //   return await lastValueFrom(this.notification.send({ cmd: 'delete-noti' }, { id, user_id }))
  // }

  // async saveNoti(id: string, user_id: string) {
  //   return await lastValueFrom(this.notification.send({ cmd: 'save-noti' }, { id, user_id }));
  // }
}
