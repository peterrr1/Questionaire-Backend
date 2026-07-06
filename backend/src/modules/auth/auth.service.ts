import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dto/request/register.dto';
import { LoginUserDto } from './dto/request/login.dto';
import { UserAuthTokensDto } from './dto/response/auth-token.dto';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}
    private readonly logger = new Logger(AuthService.name)

    async registerUser(dto: RegisterUserDto) {
        
        // Check if user exists if not create it
        await this.userService.createUser(dto)
    }


    async login(data: LoginUserDto): Promise<UserAuthTokensDto> {
        const user = await this.userService.findUserByEmailOrThrow(data.email)
        this.logger.log(user)
        const passwordHash = await bcrypt.compare(data.password, user.password)

        if (!passwordHash) {
            throw new ForbiddenException("Password is incorrect!")
        }

        const tokens = await this.generateTokens(user.id, user.email)

        await this.updateRefreshToken(user.id, tokens.refreshToken)

        return tokens
    }

    async logout(user_id: string) {
        return this.userService.updateUserData(user_id, {
            refresh_token: null,
            refresh_token_expiry: null
        })
    }

    async updateRefreshToken(id: string, refresh_token: string): Promise<void> {
        const salt = await bcrypt.genSalt(10)
        const hashedRefreshToken = await bcrypt.hash(refresh_token, salt)

        await this.userService.updateUserData(id, {
            refresh_token: hashedRefreshToken,
            refresh_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
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
        this.logger.log(user)

        if (!user || !user.refresh_token) {
            await this.resetRefreshToken(user.id)
            throw new ForbiddenException("Access Denied")
        }

        if (!user.refresh_token_expiry || new Date(user.refresh_token_expiry).getTime() <= Date.now()) {
            await this.resetRefreshToken(user.id)
            throw new ForbiddenException("Access denied")
        }

        const refresh_tokens_match = await bcrypt.compare(refreshToken, user.refresh_token)
        if (!refresh_tokens_match) {
            throw new ForbiddenException('Access Denied')
        }

        const tokens = await this.generateTokens(user.id, user.email)
        await this.updateRefreshToken(user.id, tokens.refreshToken)

        return tokens
    }

    private async resetRefreshToken(user_id: string): Promise<void> {
        await this.userService.updateUserData(user_id, {
                refresh_token: null,
                refresh_token_expiry: null
            })
    }
}
