import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SQLDatabaseModule } from './shared/sqldb/sqldb.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { MongodbModule } from './shared/mongodb/mongodb.module';
import { SeederModule } from './modules/common/seeder/seeder.module';
import { FilesModule } from './shared/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    MongodbModule,
    SQLDatabaseModule,
    UserModule,
    AuthModule,
    QuizModule,
    SeederModule,
    FilesModule
  ]
})
export class AppModule {}
