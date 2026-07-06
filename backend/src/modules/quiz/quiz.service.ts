import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { QuizDto } from './dto/response/quiz.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { QUESTION_DTO_BY_TYPE, QuestionDto } from './dto/response/question.dto';
import { v4 as uuidv4 } from 'uuid';
import { FilesAzureService } from 'src/shared/files/files.service';
import { QuizDraftDto } from './dto/request/quiz-draft.dto';
import { toCategoryKey } from 'src/utils/category.util';
import { CosmosDBService } from 'src/shared/cosmosdb/cosmosdb.service';
import { BulkOperationType, Container, JSONObject, Operation, OperationInput } from '@azure/cosmos';
import { ConfigService } from '@nestjs/config';
import { SqlQuerySpec } from 'node_modules/@azure/cosmos/dist/esm';
import { QuizDocument } from './schemas/quiz.schema';
import { partition } from 'rxjs';
import { QuestionDocument } from './schemas/question.schema';
import { TypeInfoDto } from './dto/response/type_info.dto';
import { TypeInfo } from './schemas/type.schema';

enum Visibility {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE'
}

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

    async createQuiz(user_id: string, quiz_draft: QuizDraftDto): Promise<{quiz_id: string}> {
        const quiz_id = uuidv4()

        const user = await this.userService.findUserById(user_id)
    
        
        const questions = quiz_draft.questions.map(q => {
            const options = q.options.map(o => ({
                id: uuidv4(),
                option: o.option,
            }));


            if (!Number.isInteger(q.correct_option) || q.correct_option < 1 || q.correct_option > options.length) {
                throw new BadRequestException(`correct_option out of range for question "${q.question}"`)
            }

            const correctOptionId = options[q.correct_option - 1].id;
            

            return {
                id: uuidv4(),
                quiz_id: quiz_id,
                type: q.type,
                category: toCategoryKey(q.category),
                category_display_name: q.category,
                question: q.question,
                correct_option: correctOptionId,
                options,
            };
        });

        const operations: OperationInput[] = questions.map(question => ({
            operationType: BulkOperationType.Create,
            partitionKey: question.quiz_id,
            resourceBody: question as unknown as JSONObject
        }))

        const results = await this.questionContainer.items.executeBulkOperations(operations)

        const failures = results.filter(r => r.error !== undefined)

        if (failures.length > 0) {
            this.logger.error(`${failures.length}/${operations.length} question writes failed for quiz ${quiz_id}`, failures[0].error)
            throw new InternalServerErrorException("Failed to save quiz questions")
        }

        const quiz: QuizDocument = {
            id: quiz_id,
            quiz_id: quiz_id,
            name: quiz_draft.quiz_information.quiz_name,
            question_types: quiz_draft.quiz_information.question_categories.map(q => toCategoryKey(q)),
            types_display_name: quiz_draft.quiz_information.question_categories,
            visibility: quiz_draft.quiz_information.visibility,
            created_at: new Date().toISOString(),
            author: {
                id: user.id,
                username: user.username,
                created_at: user.created_at

            }
        }

        // Create a quiz entity
        await this.quizContainer.items.create(quiz)

        
        try {
            await this.filesService.uploadDefaultQuizImage(quiz_id)
        } catch (e) {
            this.logger.warn(`Default quiz image upload failed for ${quiz_id}`, e)
        }

        return { quiz_id: quiz.id }

    }



    async getAllQuiz(user_id: string | undefined): Promise<QuizDto[]> {
        const querySpec: SqlQuerySpec = user_id !== undefined
            ? {
                query: "SELECT * FROM q WHERE q.visibility = @public OR q.author.id = @user_id",
                parameters: [
                    { name: "@public", value: Visibility.PUBLIC },
                    { name: "@user_id", value: user_id }
                ]
            }
            : {
                query: "SELECT * FROM q WHERE q.visibility = @public",
                parameters: [{ name: "@public", value: Visibility.PUBLIC }]
            }

        const { resources } = await this.quizContainer.items
            .query(querySpec).fetchAll()
        
        return resources.map(quiz => plainToInstance(QuizDto, quiz, {
            excludeExtraneousValues: true}))
    }



    async findQuizByIdOrThrow(quiz_id: string): Promise<QuizDocument> {
        const { resource } = await this.questionContainer.item(quiz_id, quiz_id).read<QuizDocument>()

        if (resource === undefined) {
            throw new NotFoundException(`Quiz with id ${quiz_id} doesn't exist.`)
        }

        return resource
    }




    // These two could be combined into one function, or at least reduce code duplications
    async getAllQuestionOrThrow(quiz_id: string): Promise<QuestionDto[]> {
        const { resources } = await this.questionContainer.items.query({
            query: "SELECT * FROM c WHERE c.quiz_id = @quiz_id",
            parameters: [{
                name: "@quiz_id", value: quiz_id
            }]}, { partitionKey: quiz_id}).fetchAll()
          
            this.logger.debug(JSON.stringify(resources[0]))

            return resources.map(q => plainToInstance(QuestionDto, q, {
                excludeExtraneousValues: true
            }))
    }


    async getCategoriesForType(quiz_id: string, type: string): Promise<TypeInfoDto[]> {
        const querySpec: SqlQuerySpec = {
            query: "SELECT DISTINCT q.category, q.category_display_name FROM q WHERE q.quiz_id = @quiz_id AND q.type = @type",
            parameters: [
                { name: "@quiz_id", value: quiz_id },
                { name: "@type", value: type}
            ]
        }

        const { resources } = await this.questionContainer.items
            .query<TypeInfo>(querySpec, { partitionKey: quiz_id })
            .fetchAll()
        
        return resources.map(q => plainToInstance(TypeInfoDto, q, { excludeExtraneousValues: true }))
    }


    async getAllQuestionByTypeAndCategoryOrThrow(quiz_id: string, category: string, type: string): Promise<QuestionDto[]> {
        const querySpec: SqlQuerySpec = {
            query: "SELECT * FROM c WHERE c.quiz_id = @quiz_id AND c.category = @category AND c.type = @type",
            parameters: [
                { name: "@quiz_id", value: quiz_id },
                { name: "@category", value: category },
                { name: "@type", value: type }
            ]}

        const { resources } = await this.questionContainer.items
            .query(querySpec, { partitionKey: quiz_id })
            .fetchAll()

        return resources.map(q => plainToInstance(QUESTION_DTO_BY_TYPE[q.type] ?? QuestionDto, q, {excludeExtraneousValues: true}))
    }



    async addQuestionToDocument(quiz_id: string, question: QuestionDocument): Promise<void> {
        await this.questionContainer.items.create({...question, quiz_id})
    }



    async deleteQuizById(quiz_id: string): Promise<void> {
        await this.quizContainer.item(quiz_id, quiz_id).delete()
        await this.questionContainer.deleteAllItemsForPartitionKey(quiz_id)
        await this.filesService.deleteQuizImage(quiz_id)
    }
}