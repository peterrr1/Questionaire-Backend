import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection } from "mongoose";
import { QuizEntity } from "src/modules/quiz/entities/quiz.entity";
import { QuizService } from "src/modules/quiz/quiz.service";
import { QuestionDocument } from "src/modules/quiz/schemas/question.schema";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { UserService } from "src/modules/user/user.service";
import { Repository } from "typeorm";

@Injectable()
export class SeederService implements OnApplicationBootstrap {
    constructor(
        private userService: UserService,
        private quizService: QuizService,
        private readonly configService: ConfigService
    ) {}
    private readonly logger = new Logger(SeederService.name)

    async onApplicationBootstrap() {
        const quiz_id = this.configService.get<string>("DEFAULT_QUIZ_ID")
        const quiz_name = process.env.DEFAULT_QUIZ_NAME

        if (quiz_id === undefined)
            throw new NotFoundException("Default quiz id is undefined!")

        if (quiz_name === undefined)
            throw new NotFoundException("Default collection name is undefined!")

        const quizExists = await this.quizService.findQuizByIdOrNull(quiz_id)
        this.logger.log("QUIZ: "+ quizExists?.id)
        const userExists = await this.userService.findUserByEmailOrNull(process.env.DEFAULT_USER_EMAIL!)
        this.logger.log("USER: "+ userExists?.id)
        
        let userId = userExists?.id

        // TODO: Check if the default user exists
        if (!userExists) {
            this.logger.log("Default user does not exists, creating it now.")
            
            const newUser = await this.userService.createUser({
                email: this.configService.get('DEFAULT_USER_EMAIL')!,
                username: this.configService.get('DEFAULT_USER_NAME')!,
                password: this.configService.get('DEFAULT_USER_PASSWORD')!
            })
            userId = newUser.id
        }

        if (!quizExists) {
            this.logger.log("Default quiz does not exists, creating it now.")
            // If the default quiz doesn't exists create the quiz and the author profile
            // Get question categories 
            const categories_display_name = await this.quizService.getCategoriesDisplayNamesForQuiz(quiz_id)
            this.logger.log(`Categories display name: ${categories_display_name}`)

            await this.quizService.createQuizWithSpecificId(userId!, quiz_name, quiz_id, categories_display_name)
            
        }
    }
}