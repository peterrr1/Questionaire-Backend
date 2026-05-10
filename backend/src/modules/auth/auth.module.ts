import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessTokenStrategy } from './strategies/access-token.strategy';
import { QuizModule } from '../quiz/quiz.module';
import { JwtRefreshTokenStrategy } from './strategies/refresh-token.strategy';


@Module({
  imports: [
    UserModule,
    QuizModule,
    PassportModule,
    JwtModule.register({})
  ],
  providers: [AuthService, JwtAccessTokenStrategy, JwtRefreshTokenStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
