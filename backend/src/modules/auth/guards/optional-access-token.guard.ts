import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenExpiredError } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";

@Injectable()
export class OptionalJwtAccessTokenGuard extends AuthGuard("jwt-access") {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err) throw err

        if (info instanceof TokenExpiredError) {
            throw new UnauthorizedException('Access token expired')
        }
        const req = context.switchToHttp().getRequest<Request>()
        const hasAuthHeader = Boolean(req.headers.authorization)

        if (hasAuthHeader && !user) {
            throw new UnauthorizedException('Invalid access token') 
        }
        return user || undefined
    }
}