import { Body, Controller, Delete, Get, Header, NotFoundException, Param, Post, Query, Request, Res, StreamableFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizInfoDto } from './dto/response/quiz.dto';
import { QuizInfoCompactDto } from './dto/response/quiz-compact.dto';
import { QuestionDto } from './dto/response/question.dto';
import { JwtAccessTokenGuard } from '../auth/guards/access-token.guard';
import { QuizDraftDto } from './dto/request/quiz-draft.dto';
import { UserService } from '../user/user.service';
import { RequestUser } from 'src/utils/request-user-interface.util';
import { OptionalJwtAccessTokenGuard } from '../auth/guards/optional-access-token.guard';


@Controller('quiz')
export class QuizController {
    constructor(
        private quizService: QuizService,
        private userService: UserService
    ) {}

    @UseGuards(JwtAccessTokenGuard)
    @Post('create')
    async createQuiz(
        @Request() req: { user: RequestUser },
        @Body() dto: QuizDraftDto
    ): Promise<void> {
        console.log(`CREATE ->${req.user.id}`)
        console.log('raw dto:', dto);
        return this.quizService.createQuiz(req.user.id, dto)
    }

    @UseGuards(OptionalJwtAccessTokenGuard)
    @Get('list')
    async getAllQuiz(
        @Request() req: { user: RequestUser | undefined }
    ): Promise<QuizInfoCompactDto[]> {
        return this.quizService.getAllQuiz(req.user?.id)
    }

    //@UseGuards(JwtAccessTokenGuard)
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
    async getQuizInformation(
        @Request() req: {user : RequestUser | undefined},
        @Param('quiz_id') quiz_id: string
    ): Promise<QuizInfoDto> {
        
        // Load quiz info
        const quizInfo = await this.quizService.findOneQuizByIdOrThrow(quiz_id)

        if (req.user === undefined) {
            const respondDto = this.quizService.createQuizInfoResponseDto(quizInfo, false)
            //console.log(respondDto)
            return respondDto
        } else {
            console.log(`INFO/:ID ->${req.user.id}`)
            // Check user
            const editable = await this.quizService.isEditable(req.user.id, quiz_id)
            
            console.log("QUIZ INFO")
            console.log(quizInfo)

            // Load question info
            //const questionCategories = [...new Set((await this.quizService.getAllQuestionOrThrow(quizInfo.collection_id)).map((quiz) => quiz.category))]
            
            const respondDto = this.quizService.createQuizInfoResponseDto(quizInfo, editable)
            //console.log(respondDto)
            return respondDto
        }

        
    }

    @UseGuards(JwtAccessTokenGuard)
    @Delete('delete/:quiz_id')
    async deleteQuiz(
        @Request() req: { user: RequestUser},
        @Param('quiz_id') quiz_id: string
    ): Promise<void> {
        await this.quizService.deleteQuizViaQuizId(quiz_id)
    }

}
