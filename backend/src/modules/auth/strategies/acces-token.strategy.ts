import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
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
            secretOrKey:  configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            passReqToCallback: true,
            ignoreExpiration: false
        })
     }

    async validate(req: Request, payload: JwtPayload) {
        console.log(req.ip)
        console.log(req.headers['user-agent'])
        // Look up user in the DB, if it doesn't exist it throws 404
        // We catch 404 here then throw 401
        console.log(payload)
        try {
            return await this.userService.findUserById(payload.sub)
        } catch (e) {
            throw new UnauthorizedException("User with the specific user id is unauthorized.")
        }
    }
}