import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserService } from "src/modules/user/user.service";

type JwtPayload = {
    sub: string
    email: string
}

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy, "jwt-access") {
     constructor(
        configService: ConfigService,
        private userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey:  configService.getOrThrow<string>('JWT_ACCESS_SECRET')
        })
     }

    async validate(payload: JwtPayload) {
        // Look up user in the DB, if it doesn't exist, throw exception
        await this.userService.findUserById(payload.sub)
        return payload
    }
}