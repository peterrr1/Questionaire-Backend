import { Injectable, NotFoundException, OnApplicationBootstrap } from "@nestjs/common";
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
        @InjectConnection() private readonly connection: Connection,
        private userService: UserService,
        private quizService: QuizService,
        private readonly configService: ConfigService
    ) {}

    async onApplicationBootstrap() {
        console.log("PROCESS ENV: " + process.env.DEFAULT_COLLECTION_ID)
        const collection_id = process.env.DEFAULT_COLLECTION_ID
        const quiz_name = process.env.DEFAULT_QUIZ_NAME

        if (collection_id === undefined)
            throw new NotFoundException("Default collection id is undefined!")

        if (quiz_name === undefined)
            throw new NotFoundException("Default collection name is undefined!")

        const quizExists = await this.quizService.findOneQuizByCollectionIdOrNull(collection_id)
        console.log("QUIZ: "+ quizExists?.id)
        const userExists = await this.userService.findUserByEmailOrNull(process.env.DEFAULT_USER_EMAIL!)
        console.log("USER: "+ userExists?.id)
        
        let userId = userExists?.id

        // TODO: Check if the default user exists
        if (!userExists) {
            console.log("Default user does not exists, creating it now.")
            
            const newUser = await this.userService.createUser({
                email: this.configService.get('DEFAULT_USER_EMAIL')!,
                username: this.configService.get('DEFAULT_USER_NAME')!,
                password: this.configService.get('DEFAULT_USER_PASSWORD')!
            })
            userId = newUser.id
        }

        if (!quizExists) {
            console.log("Default quiz does not exists, creating it now.")
            // If the default quiz doesn't exists create the quiz and the author profile
            // Get question categories 
            let categories_display_name = await this.connection.model<QuestionDocument>(collection_id).distinct('category_display_name').exec()
            let categories = await this.connection.model<QuestionDocument>(collection_id).distinct('category').exec()

            console.log(`Categories display name: ${categories_display_name}`)
            console.log(`Categories: ${categories}`)

            await this.quizService.createQuizWithSpecificId(userId!, quiz_name, collection_id, categories_display_name)
            
        }
    }
}