import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { DatePickerQuestion, DatePickerQuestionSchema, ImageDescriptionQuestion, ImageDescriptionQuestionSchema, Question, QuestionSchema, SingleOptionQuestion, SingleOptionQuestionSchema, SpeakingTopicQuestion, SpeakingTopicQuestionsSchema } from './schemas/question.schema';

@Module({
  imports: [

    MongooseModule.forFeature([{
      name: Question.name,
      schema: QuestionSchema,
      discriminators: [
        { name: SingleOptionQuestion.name, schema: SingleOptionQuestionSchema },
        { name: ImageDescriptionQuestion.name, schema: ImageDescriptionQuestionSchema },
        { name: DatePickerQuestion.name, schema: DatePickerQuestionSchema },
        { name: SpeakingTopicQuestion.name, schema: SpeakingTopicQuestionsSchema }
      ]
    }]),
  ],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService]
})
export class QuizModule {}
