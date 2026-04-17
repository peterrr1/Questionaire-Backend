import { Body, Controller, Get, Header, NotFoundException, Param, Post, Query, Request, Res, StreamableFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizInfoDto } from './dto/response/quiz.dto';
import { QuizInfoCompactDto } from './dto/response/quiz-compact.dto';
import { QuestionDto } from './dto/response/question.dto';
import { JwtAccessTokenGuard } from '../auth/guards/access-token.guard';


@Controller('quiz')
export class QuizController {
    constructor(
        private quizService: QuizService,
    ) {}

    @UseGuards(JwtAccessTokenGuard)
    @Post('create')
    async createQuiz(
        @Request() req: any,
        @Body() dto: { name:  string }
    ): Promise<void> {
        return this.quizService.createQuiz(req.user.id, dto.name)
    }

    @UseGuards(JwtAccessTokenGuard)
    @Get('list')
    async getAllQuiz(): Promise<QuizInfoCompactDto[]> {
        return this.quizService.getAllQuiz()
    }

    @UseGuards(JwtAccessTokenGuard)
    @Get('questions/:collection_id')
    async getAllQuestionByCategory (
        @Param('collection_id') collection_id: string,
        @Query('category') category: string
    ): Promise<QuestionDto[]> {
        console.log(category)
        if (category === undefined) {
            return this.quizService.getAllQuestionOrThrow(collection_id)
        }
        return this.quizService.getAllQuestionByCategoryOrThrow(collection_id, category)
    }

    @UseGuards(JwtAccessTokenGuard)    
    @Get('info/:quiz_id')
    async getQuizInformation(@Param('quiz_id') quiz_id: string): Promise<QuizInfoDto> {
        // Load quiz info
        const quizInfo = await this.quizService.findOneQuizByIdOrThrow(quiz_id)

        // Load question info
        const questionCategories = [...new Set((await this.quizService.getAllQuestionOrThrow(quizInfo.collection_id)).map((quiz) => quiz.category))]
        
        return this.quizService.createQuizInfoResponseDto(quizInfo, questionCategories)
    }
}
