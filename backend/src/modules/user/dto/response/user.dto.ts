import { Exclude, Expose } from "class-transformer"
import { IsString } from "class-validator"

@Exclude()
export class UserDto {
    @Expose()
    @IsString()
    username: string
    @Expose()
    createdAt: Date
}