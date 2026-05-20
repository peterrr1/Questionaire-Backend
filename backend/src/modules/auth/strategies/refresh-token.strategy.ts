import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

type JwtRefreshPayload = {
    sub: string
    email: string
}

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
    constructor(
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
            passReqToCallback: true,
            ignoreExpiration: false
        })
    }
    validate(req: Request, payload: any) {
        const authHeader = req.get('Authorization')
        const refreshToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim() : undefined
        
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing')
        }
        return { id: payload.sub, email: payload.email, refreshToken }
    }
}