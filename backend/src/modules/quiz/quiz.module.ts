import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizEntity } from './entities/quiz.entity';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './schemas/question.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizEntity]),
    UserModule
  ],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService]
})
export class QuizModule {}
