import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { QuizService } from './quiz.service';


@Controller('quiz')
export class QuizController {
    constructor(
        private quizService: QuizService
    ) {}

    @Get('questions')
    async getSingleOptionQuestions(
        @Query('category') category: string,
        @Query('type') type: string
    ) {
        return this.quizService.getQuestionsByCategory(category, type)
    }

    // Later it can be selected how many image question should be there
    @Get('images')
    async getImageDescriptionsQuestions() {
        return this.quizService.getQuestionsByCategory(undefined, "IMAGE_DESCRIPTION")
    }

    @Get('hunting-seasons')
    async getHuntingSeasonsQuestions() {

    }
    
    // Complete exam simulation
    @Get('simulate')
    async examSimulation() {
        // 50 single option

        // image desc

        // hunting seasons
    }

}
