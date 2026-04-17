import { Exclude, Expose } from "class-transformer"
import { IsString } from "class-validator"

@Exclude()
export class UserAuthTokensDto {
    @Expose()
    @IsString()
    accessToken: string

    @Expose()
    @IsString()
    refreshToken: string
}