import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizEntity } from './entities/quiz.entity';
import { MongoInvalidArgumentError, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Question, QuestionDocument, QuestionSchema } from './schemas/question.schema';
import { Connection, ConnectionStates, Model } from 'mongoose';
import { QuizInfoDto } from './dto/response/quiz.dto';
import { UserDto } from '../user/dto/response/user.dto';
import { QuizInfoCompactDto } from './dto/response/quiz-compact.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { QuestionDto } from './dto/response/question.dto';
import { v4 as uuidv4 } from 'uuid';
import { FilesAzureService } from 'src/shared/files/files.service';
import { QuizDraftDto } from './dto/request/quiz-draft.dto';
import { toCategoryKey, toCategoryKeyHash } from 'src/utils/category.util';
import { Visibility } from '../common/enums/enum.common';
import { UUID } from 'typeorm/driver/mongodb/bson.typings.js';

@Injectable()
export class QuizService {
    constructor(
        @InjectConnection() private readonly connection: Connection,
        @InjectRepository(QuizEntity) private quizRepository: Repository<QuizEntity>,
        private userService: UserService,
        private filesService: FilesAzureService
    ) {
        this.registerAllCollections()

        this.connection.on('reconnected', async () => {
            console.log('MongoDB reconnected: re-registering collections');
            await this.registerAllCollections();
        })
    }

    private async registerAllCollections(): Promise<void> {
        const collections = await this.connection.db?.listCollections().toArray()
        console.log("Number of collections: " + collections?.length)

        if (collections === undefined)
            throw new InternalServerErrorException("Cannot re-register collections.")

        for (const collection of collections) {
            // Get collection name (collection_id)
            const name = collection.name

            // Register collections
            if (!this.connection.modelNames().includes(name)) {
                this.connection.model<QuestionDocument>(name, QuestionSchema, name)
                console.log(`Registered model for collection: ${name}`);
            }
        }
    }

    private getModel(collectionName: string): Model<QuestionDocument> {
        console.log('Connection state:', this.connection.readyState);
        console.log('Model names:', this.connection.modelNames());

        if (this.connection.modelNames().includes(collectionName)) {
            return this.connection.model<QuestionDocument>(collectionName)
        }
        throw new NotFoundException("Collection doesn't exists!")
    }

    async createQuiz(user_id: string, quizDraft: QuizDraftDto): Promise<void> {
        // Find the user that creates the quiz
        const user = await this.userService.findUserById(user_id)
        const quizId = uuidv4()

        const defaultDisplayImageUrl = await this.filesService.uploadDefaultQuizImage(quizId)
        
        // Create a quiz entity
        const newQuiz = this.quizRepository.create({
            id: quizId,
            name: quizDraft.quiz_information.quiz_name,
            question_categories: quizDraft.quiz_information.question_categories.map(q => toCategoryKey(q)),
            categories_display_name: quizDraft.quiz_information.question_categories,
            visibility: quizDraft.quiz_information.visibility as Visibility,
            author: user,
            displayImageUrl: defaultDisplayImageUrl,
        })

        // Save the newly created quiz entity
        await this.quizRepository.save(newQuiz)

        console.log('Connection ID:', this.connection.id)
        console.log('Connection state:', this.connection.readyState)
        console.log('Model names:', this.connection.modelNames())
        
        // Create a mongodb collection
        this.connection.model<QuestionDocument>(
            newQuiz.collection_id,
            QuestionSchema,
            newQuiz.collection_id
        )
        
        // Add questions
        if (quizDraft === undefined) {
            throw new BadRequestException("Quiz draft wasn't specified.")
        }

        this.connection.model<QuestionDocument>(newQuiz.collection_id).create(
            quizDraft.questions.map(q => {
                const options = q.options.map(o => ({
                    _id: uuidv4(),
                    option: o.option
                }))
                const correctOptionId = options[q.correct_option - 1]._id
                return {
                    type: q.type,
                    category: toCategoryKey(q.category),
                    category_display_name: q.category,
                    question: q.question,
                    correct_option: correctOptionId,
                    options: options
                    }}
                )
        )
    }


    async createQuizWithSpecificId(user_id: string, name: string, collection_id: string, categories_display_name: string[]) {
        const user = await this.userService.findUserById(user_id)
        const quizId = uuidv4()

        const defaultDisplayImageUrl = await this.filesService.uploadDefaultQuizImage(quizId)

        // Create a quiz entity
        const newQuiz = this.quizRepository.create({
            id: quizId,
            collection_id: collection_id,
            name: name,
            author: user,
            question_categories: categories_display_name.map(q => toCategoryKey(q)),
            categories_display_name: categories_display_name,
            displayImageUrl: defaultDisplayImageUrl
        })
        // Save the newly created quiz entity
        await this.quizRepository.save(newQuiz)
        
        // Create a mongodb collection
        this.connection.model<QuestionDocument>(
            newQuiz.collection_id,
            QuestionSchema,
            newQuiz.collection_id
        )
    }

    async addQuestionToDocument(collection_id, question): Promise<void> {
        this.connection.model<QuestionDocument>(collection_id).insertOne(question)
    }

    async getAllQuiz(): Promise<QuizInfoCompactDto[]> {
        const quizList = await this.quizRepository.find()
        return quizList.map(quiz => plainToClass(QuizInfoCompactDto, quiz))
    }

    async findQuizByIdOrNull(id: string): Promise<QuizEntity | null> {
        return this.quizRepository.findOneBy({id: id})
    }

    async findOneQuizByIdOrThrow(id: string): Promise<QuizEntity> {
        const quiz = await this.quizRepository.findOne({
            where: {id: id},
            relations: {author: true}
        })
        
        if (quiz === null) {
            throw new NotFoundException(`Quiz with id ${id} doesn't exist.`)
        }

        return quiz
    }

    async findOneQuizByCollectionIdOrNull(collection_id: string): Promise<QuizEntity | null> {
        return await this.quizRepository.findOneBy({collection_id: collection_id})
    }

    // These two could be combined into one function, or at least reduce code duplications
    async getAllQuestionOrThrow(collection_id: string): Promise<QuestionDto[]> {
        const questions = await this.getModel(collection_id).find().lean().exec()
        console.log(questions)
        if (questions === null) {
            throw new NotFoundException(`Can't find questions for this quiz.`)    
        }
        return questions.map(q => plainToClass(QuestionDto, q, {excludeExtraneousValues: true}))
    }

    async getAllQuestionByCategoryOrThrow(collection: string, category: string): Promise<QuestionDto[]> {
        const questions = await this.getModel(collection).find({category: category}).lean().exec()
        if (questions === null) {
            throw new NotFoundException(`Can't find questions for category ${category} in this quiz.`)    
        }
        return questions.map(q => plainToClass(QuestionDto, q, {excludeExtraneousValues: true}))
    } 


    
    async createQuizInfoResponseDto(quizInfo: QuizEntity): Promise<QuizInfoDto> {
        const userPublicInfoDto = {
            username: quizInfo.author.username,
            createdAt: quizInfo.author.createdAt
        } as UserDto

        // Create response dto
        const quizInfoDto = {
            id: quizInfo.id,
            name: quizInfo.name,
            collection_id: quizInfo.collection_id,
            visibility: quizInfo.visibility,
            author: userPublicInfoDto,
            question_categories: quizInfo.question_categories,
            categories_display_name: quizInfo.categories_display_name
        } as QuizInfoDto
        
        return quizInfoDto
    }
}
