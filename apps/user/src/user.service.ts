import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'libs/Schema/user/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  // ===== Check User =====
  async checkUserExists(email: string, username: string): Promise<User | null> {
    if (username === undefined) {
      const user = await this.userModel.findOne({ email }).exec()
      return user
    }

    if (email === undefined) {
      const user = await this.userModel.findOne({ username }).exec()
      return user
    }

    const user = await this.userModel.findOne({ $or: [{ email }, { username }] }).exec();
    return user
  }

  async checkUserExistsWithPassword(email: string, username: string): Promise<User | null> {
    const user = await this.userModel.findOne({ $or: [{ email }, { username }] }).select('+password').exec();
    return user
  }
  // ===== End Check User =====

  async register(data: any) {
    const newUser = new this.userModel(data)
    return await newUser.save();
  }

  async updateVerifyEmailCode(code: string, email: string) {
    const result = await this.userModel.updateOne(
      { email },
      { $set: { verify_email_code: code } }
    );

    if (result.modifiedCount === 0) {
      return { success: false }
    }

    return { success: true };
  }

  async updateVeridy(email: string) {
    const result = await this.userModel.updateOne(
      { email },
      { $set: { verified: true } }
    );

    if (result.modifiedCount === 0) {
      return { success: false }
    }

    return { success: true };
  }

  async updateVerifyForgotPasswordCode(code: string, email: string) {
    const result = await this.userModel.updateOne(
      { email },
      { $set: { verify_forgot_password_code: code } }
    );

    if (result.modifiedCount === 0) {
      return { success: false }
    }

    return { success: true };
  }

  async changePasswordRecovery(email: string, passHash: string) {
    const result = await this.userModel.updateOne(
      { email },
      { $set: { verify_forgot_password_code: "", password: passHash } }
    );

    if (result.modifiedCount === 0) {
      return { success: false }
    }

    return { success: true };
  }

  async changePassword(email: string, passHash: string) {
    const result = await this.userModel.updateOne({ email }, { $set: { password: passHash } })

    if (result.modifiedCount === 0) {
      return { success: false }
    }

    return { success: true };
  }

  async createUserGoogle(username: string, email: string, verified: boolean, google_id: string, avatar: string){
    try {
      const newUser = new this.userModel({
        username,
        email,
        verified,
        google_id,
        avatar
      });
      console.log(newUser)
      return await newUser.save();
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.email) {
        return { success: false, message: 'Can not create user with this google account'}
      }
      return { success: false, message: 'Can not create user with this google account'}
    }
  }
}
