import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { LoginUserDto } from './dto/request/login.dto';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/request/register.dto';
import type { Request } from 'express';
import { JwtAccessTokenGuard } from './guards/access-token.guard';
import { JwtRefreshTokenGuard } from './guards/refresh-token.guard';
import { UserAuthTokensDto } from './dto/response/auth-token.dto';

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
    async logout(@Req() req: Request) {

        await this.authService.logout(req.user?.['sub'])
    }

    @UseGuards(JwtRefreshTokenGuard)
    @Get('refresh')
    async refreshTokens(@Req() req: Request) {
        const userId = req.user?.['sub']
        console.log(`UserID: ${userId}`)
        const refreshToken = req.user?.['refreshToken']
        console.log(`Token: ${refreshToken}`)
        
        return this.authService.refreshTokens(userId, refreshToken)
    }


}
