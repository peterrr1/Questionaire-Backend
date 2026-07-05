import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuizModule } from './modules/quiz/quiz.module';
import { MongodbModule } from './shared/mongodb/mongodb.module';
import { FilesModule } from './shared/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    MongodbModule,
    QuizModule,
    FilesModule
  ]
})
export class AppModule {}
