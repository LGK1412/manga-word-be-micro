import { BadRequestException, Controller, Get, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { RegisterDto } from 'libs/Dto/auth/register.dto';
import { EmailDto } from 'libs/Dto/auth/email.dto';
import { VerifyEmailDto } from 'libs/Dto/auth/verifyEmail.dto';
import { LoginDto } from 'libs/Dto/auth/login.dto';
import { PassordRecoveryDto } from 'libs/Dto/auth/password-recovery.dto';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @MessagePattern({ cmd: 'register' })
  async regiter(@Payload() data: RegisterDto) {
    const res = await this.authService.register(data)

    if (res.success !== true) {
      return { success: false, message: res.message || 'Registeration failed' }
    } else {
      return { success: true, message: 'Registeration successfully' }
    }
  }

  @MessagePattern({ cmd: 'send_verification_email' })
  async sendVerificationEmail(@Payload() data: EmailDto) {
    const res = await this.authService.sendVerificationEmail(data)

    if (res.success !== true) {
      return { success: false, message: res.message || 'Send verification email failed' }
    } else {
      return { success: true, message: 'Send verification email successfully' }
    }
  }

  @MessagePattern({ cmd: 'verify_email' })
  async verifyEmail(@Payload() data: VerifyEmailDto) {
    const res = await this.authService.verifyEmail(data.code)

    if (res.success !== true) {
      return { success: false, message: res.message || 'Verification email failed' }
    } else {
      return { success: true, message: 'Verification email successfully' }
    }
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() data: LoginDto) {
    const res = await this.authService.login(data.email, data.password)

    if (res.success !== true) {
      return { success: false, message: res.message || 'Login failed' }
    } else {
      return { success: true, message: 'Login successfully', accessToken: res.accessToken, tokenPayload: res.tokenPayload }
    }
  }

  @MessagePattern({ cmd: 'send-password-recovery-email' })
  async sendPasswordRecovery(@Payload() data: EmailDto) {
    const res = await this.authService.sendPasswordRecoveryEmail(data.email)

    if (res.success !== true) {
      return { success: false, message: res.message || 'Send recovery email failed' }
    } else {
      return { success: true, message: 'Send recovery email successfully' }
    }
  }

  @MessagePattern({ cmd: 'verification_forgot_password' })
  async verificationRecoveryPassword(@Payload() data: PassordRecoveryDto) {
    const res = await this.authService.verificationRecoveryPassword(data.code, data.password)

    if (res.success !== true) {
      return { success: false, message: res.message || 'Recovery password failed' }
    } else {
      return { success: true, message: 'Recovery password successfully' }
    }
  }

  @MessagePattern({ cmd: 'change_password' })
  async changePassword(@Payload() data: { password: string, user: any }) {
    const res = await this.authService.changePassword(data.password, data.user)

    if (res.success !== true) {
      return { success: false, message: res.message || 'Change password failed' }
    } else {
      return { success: true, message: 'Change password successfully' }
    }
  }

  @MessagePattern({ cmd: 'google-login' })
  async googleLogin(@Payload() data: { id_token: string }) {
    const res = await this.authService.googleLogin(data.id_token)

    if (res.success !== true) {
      return { success: false, message: res.message || 'Login with Google failed' }
    } else {
      return { success: true, message: 'Login with Google successfully' }
    }
  }


}
