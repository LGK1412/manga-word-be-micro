import { IsNotEmpty, IsString, Length } from "class-validator";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    email: string

    @IsString()
    @IsNotEmpty()
    @Length(6, 20, { message: "Password must have 6-20 character" })
    password: string
}