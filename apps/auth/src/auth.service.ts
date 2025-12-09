import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { EmailDto } from 'libs/Dto/auth/email.dto';
import { RegisterDto } from 'libs/Dto/auth/register.dto';
import { last, lastValueFrom } from 'rxjs';
import { comparePassword, hashPassword } from 'utils/hashing/hashingBcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private googleClient: OAuth2Client,
  ) { }

  async register(data: RegisterDto) {

    const existing_user = await lastValueFrom(
      this.userClient.send({ cmd: 'check_user_exists' }, data)
    )

    if (existing_user?._id) {
      return { success: false, message: 'User with given email or username already exists' }
    }

    let passHash;
    try {
      passHash = await hashPassword(data.password);
    } catch (error) {
      return { success: false, message: 'Error hashing password' }
    }

    const newUserData = {
      ...data,
      password: passHash,
    };

    const res = await lastValueFrom(this.userClient.send({ cmd: 'create_user' }, newUserData))

    if (res?.success !== true) {
      return { success: false }
    }

    return { success: true, user: res.user }
  }

  async sendVerificationEmail(data: EmailDto) {
    const email = data.email

    const existing_user = await lastValueFrom(
      this.userClient.send({ cmd: 'check_user_exists' }, data)
    )

    if (!existing_user?._id) {
      // throw new BadRequestException('User with given email or username already exists');
      return { success: false, message: 'User with given email not exists' }
    }

    if (existing_user.verified) {
      return { success: false, message: 'User already verified' }
    }

    const code = this.jwtService.sign(
      { email, action: 'verify_email' },
      { expiresIn: '3m' },
    );

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${code}`;

    try {

      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác minh email của bạn',
        template: 'verifyEmail',
        context: { verifyUrl },
      });

      const res = await lastValueFrom(this.userClient.send({ cmd: 'update_verify_email_code' }, { code, email }))

      if (res?.success !== true) {
        return { success: false, message: 'Could not send verify email' }
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to send verification email' }
    }
  }

  async verifyEmail(code: string) {
    let payload: any;

    try {
      payload = this.jwtService.verify(code);
    } catch (err) {
      return { success: false, message: err.message || 'Invalid or expired verification code' }
    }

    if (payload.action !== 'verify_email' || !payload.email) {
      return { success: false, message: 'Invalid verification code' }
    }

    const existing_user = await lastValueFrom(
      this.userClient.send({ cmd: 'check_user_exists' }, { name: '', email: payload?.email })
    )

    if (!existing_user?._id) {
      return { success: false, message: 'User with given email not exists' }
    }

    if (existing_user.verified) {
      return { success: false, message: 'User already verified' }
    }

    if (existing_user.verify_email_code !== code) {
      return { success: false, message: 'Invalid verification code' }
    }

    const updateVerifyEmailCode = await lastValueFrom(this.userClient.send({ cmd: 'update_verify_email_code' }, { code: '', email: payload.email }))
    if (updateVerifyEmailCode?.success === true) {
      const resVerify = await lastValueFrom(this.userClient.send({ cmd: 'update_verify' }, { email: payload.email }))
      if (resVerify?.success === true) {
        return { success: true, message: 'Email verified successfully' }
      }
    }

    return { success: false, message: 'Verify failed' }
  }

  async login(email: string, password: string) {
    const existing_user = await lastValueFrom(
      this.userClient.send({ cmd: 'check_user_exists_with_password' }, { name: '', email: email })
    )

    if (!existing_user?._id) {
      return { success: false, message: 'User with given email not exists' }
    }

    if (!existing_user.verified) {
      return { success: false, message: 'User not verified yet' }
    }

    const compare = await comparePassword(password, existing_user.password)

    if (!compare) {
      return { success: false, message: 'Password invalid' }
    }

    const tokenPayload = {
      user_id: existing_user._id,
      email: existing_user.email,
      username: existing_user.username,
      role: existing_user.role,
      avatar: existing_user.avatar,
      bio: existing_user.bio,
      point: existing_user.point,
      author_point: existing_user.author_point,
      game_point: existing_user.game_point,
      lastBonus: existing_user.lastBonus
    }

    const accessToken = this.jwtService.sign(tokenPayload, { expiresIn: '360d' })

    return { success: true, accessToken, tokenPayload };
  }

  async sendPasswordRecoveryEmail(email: string) {
    const existing_user = await lastValueFrom(
      this.userClient.send({ cmd: 'check_user_exists' }, { name: '', email: email })
    )

    if (!existing_user?._id) {
      return { success: false, message: 'User with given email not exists' }
    }

    if (!existing_user.verified) {
      return { success: false, message: 'User not verified yet' }
    }

    const code = this.jwtService.sign(
      { email, action: 'recovery_password' },
      { expiresIn: '3m' },
    );

    const verifyUrl = `${process.env.CLIENT_URL}/reset-forgot-password?email=${email}&code=${code}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác nhận thay đổi mật khẩu của bạn',
        template: './verifyForgotPassword',
        context: { verifyUrl },
      });

      const res = await lastValueFrom(this.userClient.send({ cmd: 'update_verify_forgot_password_code' }, { code, email }))

      if (res?.success !== true) {
        return { success: false, message: 'Could not send recovery email' }
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to send recovery email' }
    }
  }

  async verificationRecoveryPassword(code: string, password: string) {
    let payload: any;

    try {
      payload = this.jwtService.verify(code);
    } catch (err) {
      return { success: false, message: err.message || 'Invalid or expired verification code' }
    }

    if (payload.action !== 'recovery_password' || !payload.email) {
      return { success: false, message: 'Invalid verification code' }
    }

    const existing_user = await lastValueFrom(
      this.userClient.send({ cmd: 'check_user_exists' }, { name: '', email: payload?.email })
    )

    if (!existing_user?._id) {
      return { success: false, message: 'User with given email not exists' }
    }

    if (!existing_user.verified) {
      return { success: false, message: 'User not verified yet' }
    }

    if (existing_user.verify_forgot_password_code !== code) {
      return { success: false, message: 'Invalid verification code' }
    }

    let passHash;

    try {
      passHash = await hashPassword(password);
    } catch (error) {
      return { success: false, message: 'Error hashing password' }
    }

    try {
      const res = await lastValueFrom(this.userClient.send({ cmd: 'change_password_recovery' }, { email: payload?.email, passHash }))
      return { success: true, message: 'Recovery password successfully' };
    } catch {
      return { success: false, message: 'Recovery password failed' };
    }
  }

  async changePassword(password: string, user: any) {
    const existing_user = await lastValueFrom(
      this.userClient.send({ cmd: 'check_user_exists' }, { name: user?.username, email: user?.email })
    )

    if (!existing_user?._id) {
      return { success: false, message: 'User with given email not exists' }
    }

    if (!existing_user.verified) {
      return { success: false, message: 'User not verified yet' }
    }

    let passHash;

    try {
      passHash = await hashPassword(password);
    } catch (error) {
      return { success: false, message: 'Error hashing password' }
    }

    try {
      const res = await lastValueFrom(this.userClient.send({ cmd: 'change_password_user' }, { email: user?.email, passHash }))
      return { success: true, message: 'Change password successfully' };
    } catch {
      return { success: false, message: 'Change password failed' };
    }
  }

  async googleLogin(id_token: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    }).catch(() => null);

    if (!ticket) {
      return { success: false, message: 'Google account invalid' };
    }

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return { success: false, message: 'Google account invalid' };
    }

    // check user
    let user = await lastValueFrom(
      this.userClient.send(
        { cmd: 'check_user_exists' },
        { name: '', email: payload.email }
      )
    );

    try {
      // nếu chưa có → tạo mới
      if (!user) {
        const randomName = 'user_' + randomBytes(4).toString('hex');

        user = await lastValueFrom(
          this.userClient.send(
            { cmd: 'create-user-google' },
            {
              username: payload.name ?? randomName,
              email: payload.email,
              verified: true,
              google_id: payload.sub,
              avatar: payload.picture ?? 'avatar-default.webp',
            }
          )
        );
      }

      console.log('User:', user);

      const tokenPayload = {
        user_id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        point: user.point,
        author_point: user.author_point,
        game_point: user.game_point,
        lastBonus: user.lastBonus,
      };

      const accessToken = this.jwtService.sign(tokenPayload, {
        expiresIn: '360d',
      });

      return { success: true, message: 'Login with Google successfully',accessToken, tokenPayload };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Login with Google failed' };
    }
  }
}
