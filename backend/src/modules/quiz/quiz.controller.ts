import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizInfoDto } from './dto/response/quiz.dto';
import { QuizInfoCompactDto } from './dto/response/quiz-compact.dto';
import { QuestionDto } from './dto/response/question.dto';
import { JwtAccessTokenGuard } from '../auth/guards/access-token.guard';
import { QuizDraftDto } from './dto/request/quiz-draft.dto';
import { RequestUser } from 'src/utils/request-user-interface.util';
import { OptionalJwtAccessTokenGuard } from '../auth/guards/optional-access-token.guard';


@Controller('quiz')
export class QuizController {
    constructor(
        private quizService: QuizService
    ) {}

    @UseGuards(JwtAccessTokenGuard)
    @Post('create')
    async createQuiz(
        @Request() req: { user: RequestUser },
        @Body() dto: QuizDraftDto
    ): Promise<void> {
        return this.quizService.createQuiz(req.user.id, dto)
    }

    @UseGuards(OptionalJwtAccessTokenGuard)
    @Get('list')
    async getAllQuiz(
        @Request() req: { user: RequestUser | undefined }
    ): Promise<QuizInfoCompactDto[]> {
        return this.quizService.getAllQuiz(req.user?.id)
    }

    @UseGuards(OptionalJwtAccessTokenGuard)
    @Get('questions/:quiz_id')
    async getAllQuestionByCategory (
        @Request() req: { user: RequestUser },
        @Param('quiz_id') quiz_id: string,
        @Query('category') category: string
    ): Promise<QuestionDto[] | string> {
        const quiz = await this.quizService.findOneQuizByIdOrThrow(quiz_id)

        if (!this.quizService.isViewableBy(quiz, req.user?.id)) {
            throw new NotFoundException(`Quiz with collection ${quiz_id} doesn't exist.`)
        }

        if (category === undefined) {
            const data = await this.quizService.getAllQuestionOrThrow(quiz_id)
            return data.length == 0 ? "No questions were found" : data
        }

        const data = await this.quizService.getAllQuestionByCategoryOrThrow(quiz_id, category)

        return data.length == 0 ? "No questions were found" : data
    }

    @UseGuards(OptionalJwtAccessTokenGuard)    
    @Get('info/:quiz_id')
    async getQuizInformation(
        @Request() req: {user : RequestUser | undefined},
        @Param('quiz_id') quiz_id: string
    ): Promise<QuizInfoDto> {
        
        // Load quiz info
        const quizInfo = await this.quizService.findOneQuizByIdOrThrow(quiz_id)

        if (!this.quizService.isViewableBy(quizInfo, req.user?.id)) {
            throw new NotFoundException(`Quiz with id ${quiz_id} doesn't exist.`)
        }

        const editable = req.user !== undefined && quizInfo.author?.id === req.user.id
        return this.quizService.createQuizInfoResponseDto(quizInfo, editable)
    }


    @UseGuards(JwtAccessTokenGuard)
    @Delete('delete/:quiz_id')
    async deleteQuiz(
        @Request() req: { user: RequestUser },
        @Param('quiz_id') quiz_id: string
    ): Promise<void> {
        
        const quiz = await this.quizService.findOneQuizByIdOrThrow(quiz_id)
        
        if (quiz.author?.id !== req.user.id) {
            throw new ForbiddenException("You are not allowed to delete this quiz.")
        }
        await this.quizService.deleteQuizViaQuizId(quiz_id)
    }
}
