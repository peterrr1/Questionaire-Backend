import { Exclude, Expose, Transform } from "class-transformer"
import { IsString } from "class-validator"


export class UserDto {
    @Expose()
    id: string

    @Expose()
    @IsString()
    username: string

    @Expose()
    email: string
    
    @Expose()
    created_at: string

    @Expose()
    @Transform(({ obj }) => `/files/users/${obj.id}/avatar`)
    profilePictureUrl: string
}