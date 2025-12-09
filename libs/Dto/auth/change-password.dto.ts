import { IsNotEmpty, IsString, Length } from "class-validator";

export class ChangePasswordDto{
    @IsString()
    @IsNotEmpty()
    @Length(6, 20, { message: "Password must have 6-20 character" })
    password: string 
}