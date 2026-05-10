import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class QuizService {
    constructor(
        @InjectRepository(QuizEntity) private quizRepository: Repository<QuizEntity>,
        @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
        private userService: UserService,
        private filesService: FilesAzureService
    ) {}

    private readonly logger = new Logger(QuizService.name)

    

    async createQuiz(user_id: string, quizDraft: QuizDraftDto): Promise<void> {
        const quizId = uuidv4()
        const defaultDisplayImageUrl = await this.filesService.uploadDefaultQuizImage(quizId)
        
        // Create a quiz entity
        const newQuiz = this.quizRepository.create({
            id: quizId,
            name: quizDraft.quiz_information.quiz_name,
            question_categories: quizDraft.quiz_information.question_categories.map(q => toCategoryKey(q)),
            categories_display_name: quizDraft.quiz_information.question_categories,
            visibility: quizDraft.quiz_information.visibility as Visibility,
            author: { id: user_id },
            displayImageUrl: defaultDisplayImageUrl,
        }
    )

        // Save the newly created quiz entity
        await this.quizRepository.save(newQuiz)


        
        const questions = quizDraft.questions.map(q => {
            const options = q.options.map(o => ({
                _id: uuidv4(),
                option: o.option,
            }));

            const correctOptionId = options[q.correct_option - 1]._id;

            return {
                quiz_id: newQuiz.id,
                type: q.type,
                category: toCategoryKey(q.category),
                category_display_name: q.category,
                question: q.question,
                correct_option: correctOptionId,
                options,
            };
        });

        await this.questionModel.insertMany(questions)
    }


    async createQuizWithSpecificId(user_id: string, name: string, quiz_id: string, categories_display_name: string[]) {
        const defaultDisplayImageUrl = await this.filesService.uploadDefaultQuizImage(quiz_id)

        // Create a quiz entity
        const newQuiz = this.quizRepository.create({
            id: quiz_id,
            name: name,
            author: { id: user_id },
            question_categories: categories_display_name.map(q => toCategoryKey(q)),
            categories_display_name: categories_display_name,
            displayImageUrl: defaultDisplayImageUrl
        })
        // Save the newly created quiz entity
        await this.quizRepository.save(newQuiz)
    }

    async getCategoriesDisplayNamesForQuiz(quiz_id: string): Promise<string[]> {
        return this.questionModel.distinct('category_display_name', { quiz_id }).exec()
    }

    async addQuestionToDocument(quiz_id: string, question: Partial<Question>): Promise<void> {
        await this.questionModel.create({ ...question, quiz_id })
    }

    async isEditable(id: string, quiz_id: string): Promise<boolean> {
        const user = await this.userService.findUserWithQuizzes(id)
        console.log("ISEDITABLE")
        console.log(id)
        console.log(user)
        return user.quizzes.some(q => q.id === quiz_id)
    }

    
    async getAllQuiz(userId: string | undefined): Promise<QuizInfoCompactDto[]> {
        const where: FindOptionsWhere<QuizEntity>[] = [{visibility: Visibility.PUBLIC}]

        if (userId !== undefined) {
            where.push({author: {id: userId}})
        }
        const quizList = await this.quizRepository.find({
            where,
            relations: { author: true}
        })
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


    // These two could be combined into one function, or at least reduce code duplications
    async getAllQuestionOrThrow(quiz_id: string): Promise<QuestionDto[]> {
        const questions = await this.questionModel.find({ quiz_id }).lean().exec()
        return questions.map(q => plainToClass(QuestionDto, q, { excludeExtraneousValues: true }))
    }

    async getAllQuestionByCategoryOrThrow(quiz_id: string, category: string): Promise<QuestionDto[]> {
        const questions = await this.questionModel.find({ quiz_id, category }).lean().exec()
        return questions.map(q => plainToClass(QuestionDto, q, { excludeExtraneousValues: true }))
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
        await this.questionModel.deleteMany({ quiz_id: quizId }).exec()
        await this.quizRepository.delete({ id: quizId })
    }

    isViewableBy(quiz: QuizEntity, userId: string | undefined): boolean {
        return quiz.visibility === Visibility.PUBLIC || quiz.author?.id === userId
    }

}
