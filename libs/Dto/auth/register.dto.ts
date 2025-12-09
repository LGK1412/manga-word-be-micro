import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    username: string

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsString()
    @IsNotEmpty()
    @Length(6, 20, { message: "Password must have 6-20 character" })
    password: string

}