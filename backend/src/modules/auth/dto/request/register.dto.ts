import { IsEmail, IsNotEmpty, MaxLength, MinLength } from "class-validator";

export class RegisterUserDto {
    @IsNotEmpty()
    @IsEmail()
    email: string

    @MinLength(4)
    @MaxLength(10)
    username: string

    @IsNotEmpty()
    @MinLength(5)
    password: string
}