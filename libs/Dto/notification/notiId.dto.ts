import { IsNotEmpty, IsString } from "class-validator";

export class NotiDto{
    @IsString()
    @IsNotEmpty()
    id: string
}