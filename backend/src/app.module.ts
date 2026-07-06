import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { FilesModule } from './shared/files/files.module';
import { CosmosDBModule } from './shared/cosmosdb/cosmosdb.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    UserModule,
    AuthModule,
    QuizModule,
    FilesModule,
    CosmosDBModule
  ]
})
export class AppModule {}
