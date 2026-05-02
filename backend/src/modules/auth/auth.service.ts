import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dto/request/register.dto';
import { LoginUserDto } from './dto/request/login.dto';
import { UserAuthTokensDto } from './dto/response/auth-token.dto';
import { plainToClass, plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}

    async registerUser(dto: RegisterUserDto) {
        // Check if user exists if not create it
        await this.userService.createUser(dto)
    }


    async login(data: LoginUserDto): Promise<UserAuthTokensDto> {
        const user = await this.userService.findUserByEmailOrThrow(data.email)
        console.log(user)
        const passwordHash = await bcrypt.compare(data.password, user.password)

        if (!passwordHash) {
            throw new ForbiddenException("Password is incorrect!")
        }

        const tokens = await this.generateTokens(user.id, user.email)

        await this.updateRefreshToken(user.id, tokens.refreshToken)

        return tokens
    }

    async logout(userId: string) {
        return this.userService.updateUserData(userId, {
            refreshToken: null,
            refreshTokenExpiry: null
        })
    }

    async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
        const salt = await bcrypt.genSalt(10)
        const hashedRefreshToken = await bcrypt.hash(refreshToken, salt)

        await this.userService.updateUserData(id, {
            refreshToken: hashedRefreshToken,
            refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        })
    }

    async generateTokens(id: string, email: string): Promise<UserAuthTokensDto> {
        const payload = { sub: id, email}
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: '15m'
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '7d'
            })
        ])

        return { accessToken, refreshToken } as UserAuthTokensDto
    } 


    async refreshTokens(userId: string, refreshToken: string): Promise<UserAuthTokensDto> {
        const user = await this.userService.findUserById(userId)
        console.log(`UserID: ${userId}`)
        console.log(user)
        if (!user || !user.refreshToken) {
            throw new ForbiddenException("Access Denied")
        }

        const refreshTokensMatch = await bcrypt.compare(refreshToken, user.refreshToken)
        console.log(refreshTokensMatch)
        if (!refreshTokensMatch) {
            throw new ForbiddenException('Access Denied')
        }

        const tokens = await this.generateTokens(user.id, user.email)
        await this.updateRefreshToken(user.id, tokens.refreshToken)

        return tokens
    }
}
