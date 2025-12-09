import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  // ===== Check User =====
  @MessagePattern({ cmd: 'check_user_exists' })
  async checkUserExists(data: { email: string, username: string }) {
    const { email, username } = data;

    return await this.userService.checkUserExists(email, username);
  }

  @MessagePattern({ cmd: 'check_user_exists_with_password' })
  async checkUserExistsForLogin(data: { email: string, username: string }) {
    const { email, username } = data;

    return await this.userService.checkUserExistsWithPassword(email, username);
  }
  // ===== End Check User =====

  @MessagePattern({ cmd: 'create_user' })
  async register(data: any) {
    const res = await this.userService.register(data)
    return { success: true, user: res }
  }

  @MessagePattern({ cmd: 'update_verify_email_code' })
  async updateVerifyEmailCode(data: { code: string, email: string }) {
    return await this.userService.updateVerifyEmailCode(data.code, data.email)
  }

  @MessagePattern({ cmd: 'update_verify' })
  async updateVerify(data: { email: string }) {
    return await this.userService.updateVeridy(data.email)
  }

  @MessagePattern({ cmd: 'update_verify_forgot_password_code' })
  async updateVerifyForgotPasswordCode(data: { code: string, email: string }) {
    return await this.userService.updateVerifyForgotPasswordCode(data.code, data.email)
  }

  @MessagePattern({ cmd: 'change_password_recovery' })
  async changePasswordRecovery(data: { email: string, passHash: string }) {
    return await this.userService.changePasswordRecovery(data.email, data.passHash)
  }

  @MessagePattern({ cmd: 'change_password_user'})
  async changePassowrd(data: { email: string, passHash: string}){
    return await this.userService.changePassword(data.email, data.passHash)
  }

  @MessagePattern({cmd: 'create-user-google'})
  async createUserGoogle(data: {username: string, email: string, verified: boolean, google_id: string, avatar: string}){
    return await this.userService.createUserGoogle(data.username, data.email, data.verified, data.google_id, data.avatar)
  }
}
