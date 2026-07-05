import { Injectable, InternalServerErrorException, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizEntity } from './entities/quiz.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Question, QuestionDocument, QuestionSchema } from './schemas/question.schema';
import { Connection, Model } from 'mongoose';
import { QuizInfoDto } from './dto/response/quiz.dto';
import { UserDto } from '../user/dto/response/user.dto';
import { QuizInfoCompactDto } from './dto/response/quiz-compact.dto';
import { plainToClass } from 'class-transformer';
import { QuestionDto } from './dto/response/question.dto';
import { v4 as uuidv4 } from 'uuid';
import { FilesAzureService } from 'src/shared/files/files.service';
import { QuizDraftDto } from './dto/request/quiz-draft.dto';
import { toCategoryKey } from 'src/utils/category.util';
import { Visibility } from '../common/enums/enum.common';
import { CosmosDBService } from 'src/shared/cosmosdb/cosmosdb.service';
import { Container } from '@azure/cosmos';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuizService implements OnModuleInit {
    constructor(
        private userService: UserService,
        private filesService: FilesAzureService,
        private cosmosDb: CosmosDBService,
        private configService: ConfigService
    ) {}
    
    private questionContainer!: Container
    private quizContainer!: Container

    onModuleInit() {
        const questionContainerName: string = this.configService.getOrThrow<string>("COSMOS_DB_QUESTIONS_CONTAINER_NAME")
        const quizContainerName: string = this.configService.getOrThrow<string>("COSMOS_DB_QUIZ_CONTAINER_NAME") 

        this.questionContainer = this.cosmosDb.getContainer(questionContainerName)
        this.quizContainer = this.cosmosDb.getContainer(quizContainerName)

    }


    private readonly logger = new Logger(QuizService.name)

    

    async createQuiz(user_id: string, quiz_draft: QuizDraftDto): Promise<void> {
        const quizId = uuidv4()
        const defaultDisplayImageUrl = await this.filesService.uploadDefaultQuizImage(quizId)
        
        // Create a quiz entity
        await this.quizContainer.items.create({
            quiz_id: quizId,
            name: quiz_draft.quiz_information.quiz_name,
            question_categories: quiz_draft.quiz_information.question_categories.map(q => toCategoryKey(q)),
            categories_display_name: quiz_draft.quiz_information.question_categories,
            visibility: quiz_draft.quiz_information.visibility,
            displayImageUrl: defaultDisplayImageUrl,
        })
        
        const questions = quiz_draft.questions.map(q => {
            const options = q.options.map(o => ({
                id: uuidv4(),
                option: o.option,
            }));

            const correctOptionId = options[q.correct_option - 1].id;

            return {
                quiz_id: quizId,
                type: q.type,
                category: toCategoryKey(q.category),
                category_display_name: q.category,
                question: q.question,
                correct_option: correctOptionId,
                options,
            };
        });

        await this.questionContainer.items.upsert(questions)

        //await this.questionModel.insertMany(questions)
    }

    async getCategoriesDisplayNamesForQuiz(quiz_id: string): Promise<string[]> {
        const { resources } = await this.questionContainer.items.query<string>({
            query: "SELECT DISTINCT VALUE c.category_display_name FROM c WHERE c.quiz_id = @quiz_id",
            parameters: [
                { name: "@quiz_id", value: quiz_id }
            ]},
            { partitionKey: quiz_id }).fetchAll()
        console.log(resources)

        return resources
        //return this.questionModel.distinct('category_display_name', { quiz_id }).exec()
    }

    async addQuestionToDocument(quiz_id: string, question: Partial<Question>): Promise<void> {
        await this.questionContainer.items.create({...question, quiz_id})
        //await this.questionModel.create({ ...question, quiz_id })
    }


    async getAllQuiz(user_id: string | undefined) {
        const where: FindOptionsWhere<QuizEntity>[] = [{visibility: Visibility.PUBLIC}]

        if (userId !== undefined) {
            where.push({author: {id: user_id}})
        }

        const quizResult = await this.questionContainer.items.query({
            query: "SELECT * from c where c.visibility = 'PUBLIC'"
        })
    }



    async findQuizByIdOrThrow(question_id: string): Promise<QuizEntity | null> {
        //return this.quizRepository.findOneBy({id: id})
        const quiz = this.questionContainer.items.query({
            query: "SELECT * FROM c where c.quiz_id = @question_id",
            parameters: [{
                name: "@question_id", value: question_id
            }]
        }).fetchAll()
        if (quiz === null) {
            throw new NotFoundException(`Quiz with id ${question_id} doesn't exist.`)
        }

        return quiz
    }


    // These two could be combined into one function, or at least reduce code duplications
    async getAllQuestionOrThrow(quiz_id: string): Promise<QuestionDto[]> {
        /* const questions = await this.questionModel.find({ quiz_id }).lean().exec()
        return questions.map(q => plainToClass(QuestionDto, q, { excludeExtraneousValues: true })) */

        const { resources } = await this.questionContainer.items.query({
            query: "SELECT * FROM c WHERE c.quiz_id = @quiz_id",
            parameters: [{
                name: "@quiz_id", value: quiz_id
            }]}, { partitionKey: quiz_id}).fetchAll()
          
            console.log(JSON.stringify(resources[0]))

            return resources.map(q => plainToClass(QuestionDto, q, {
                excludeExtraneousValues: true
            }))
    }

    async getAllQuestionByCategoryOrThrow(quiz_id: string, category: string): Promise<QuestionDto[]> {
        /* const questions = await this.questionModel.find({ quiz_id, category }).lean().exec()
        return questions.map(q => plainToClass(QuestionDto, q, { excludeExtraneousValues: true })) */

        const { resources } = await this.questionContainer.items.query({
            query: "SELECT * FROM c WHERE c.quiz_id = @quiz_id AND c.category = @category",
            parameters: [
                { name: "@quiz_id", value: quiz_id },
                { name: "@category", value: category }
            ]},
            { partitionKey: quiz_id })
            .fetchAll()
        return resources.map(q => plainToClass(QuestionDto, q, {excludeExtraneousValues: true}))
    }
    



    
    async createQuizInfoResponseDto(
        quizInfo: QuizEntity,
        editable: boolean = false
    ): Promise<QuizInfoDto> {
        const userPublicInfoDto = {
            username: quizInfo.author.username,
            createdAt: quizInfo.author.createdAt
        } as UserDto

        // Create response dto
        const quizInfoDto = {
            quiz_id: quizInfo.id,
            name: quizInfo.name,
            visibility: quizInfo.visibility,
            author: userPublicInfoDto,
            question_categories: quizInfo.question_categories,
            categories_display_name: quizInfo.categories_display_name,
            editable: editable
        } as QuizInfoDto
        
        return quizInfoDto
    }

    async deleteQuizViaQuizId(quizId: string): Promise<void> {
        await this.findOneQuizByIdOrThrow(quizId)
        //await this.questionModel.deleteMany({ quiz_id: quizId }).exec()
        await this.questionContainer.deleteAllItemsForPartitionKey(quizId)

        await this.quizRepository.delete({ id: quizId })
    }

    isViewableBy(quiz: QuizEntity, userId: string | undefined): boolean {
        return quiz.visibility === Visibility.PUBLIC || quiz.author?.id === userId
    }

}