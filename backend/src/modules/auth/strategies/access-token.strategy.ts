import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
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
            ignoreExpiration: false,
            
        })
     }

    async validate(req: Request, payload: JwtPayload) {
        console.log(req.ip)
        console.log(req.headers['user-agent'])
        // Look up user in the DB, if it doesn't exist it throws 404
        // We catch 404 here then throw 401
        try {
            const user = await this.userService.findUserById(payload.sub)
            return { id: user.id, email: user.email }
        } catch (e) {
            if (e instanceof NotFoundException) {
                throw new UnauthorizedException("User with the specific user id is unauthorized.")
            }
            throw e
        }
    }
}