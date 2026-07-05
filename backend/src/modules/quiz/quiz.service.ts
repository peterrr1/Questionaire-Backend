import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Question, QuestionDocument, QuestionSchema } from './schemas/question.schema';
import { Connection, Model } from 'mongoose';
import { plainToClass } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { FilesAzureService } from 'src/shared/files/files.service';
import { toCategoryKey } from 'src/utils/category.util';
import { filter } from 'rxjs';

@Injectable()
export class QuizService {
    constructor(
        @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
        private filesService: FilesAzureService
    ) {}

    private readonly logger = new Logger(QuizService.name)


    async getQuestionsByCategory(category: string, type: string) {
        return this.questionModel.find({'category': category, 'type': type})
    }



}
