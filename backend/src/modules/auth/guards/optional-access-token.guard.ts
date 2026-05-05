import { Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenExpiredError } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAccessTokenGuard extends AuthGuard("jwt-access") {
    handleRequest(err: any, user: any, info: any) {
        if (info instanceof TokenExpiredError) {
            throw new UnauthorizedException('Access token expired')
        }
        return user || undefined
    }
}