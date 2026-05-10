import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { LoginUserDto } from './dto/request/login.dto';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/request/register.dto';
import { JwtAccessTokenGuard } from './guards/access-token.guard';
import { JwtRefreshTokenGuard } from './guards/refresh-token.guard';
import { UserAuthTokensDto } from './dto/response/auth-token.dto';
import { RequestUser, RequestUserWithRefresh } from 'src/utils/request-user-interface.util';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) {}

    @Post('login')
    async login(@Body() loginData: LoginUserDto): Promise<UserAuthTokensDto> {
        console.log(loginData)
        return this.authService.login(loginData)
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerData: RegisterUserDto) {
        return await this.authService.registerUser(registerData)
    }

    @UseGuards(JwtAccessTokenGuard)
    @Get('logout')
    async logout(@Request() req: { user: RequestUser }) {
        await this.authService.logout(req.user.id)
    }

    @UseGuards(JwtRefreshTokenGuard)
    @Get('refresh')
    async refreshTokens(@Request() req: { user: RequestUserWithRefresh }) {
        
        return this.authService.refreshTokens(req.user.id, req.user.refreshToken)
    }


}
