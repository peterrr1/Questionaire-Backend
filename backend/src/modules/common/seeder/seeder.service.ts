import { Body, Injectable, Logger, NotFoundException, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { QuizService } from "src/modules/quiz/quiz.service";
import { UserService } from "src/modules/user/user.service";
import questionData from "../../../../assets/data.json"
import { v4 as uuidv4 } from 'uuid';
import { CosmosDBService } from "src/shared/cosmosdb/cosmosdb.service";
import { Container, JSONObject } from "@azure/cosmos";
import { OperationInput } from "node_modules/@azure/cosmos/dist/esm";

@Injectable()
export class SeederService {
    constructor(
        private cosmosDb: CosmosDBService,
        private userService: UserService,
        private quizService: QuizService,
        private readonly configService: ConfigService
    ) {}
    private readonly logger = new Logger(SeederService.name)
    private cosmosContainer!: Container

    onModuleInit() {
        this.cosmosContainer = this.cosmosDb.getContainer()
    }

    async run() {
        const quiz_id = this.configService.get<string>("DEFAULT_QUIZ_ID")
        const quiz_name = this.configService.get<string>("DEFAULT_QUIZ_NAME")


        if (quiz_id === undefined)
            throw new NotFoundException("Default quiz id is undefined!")

        if (quiz_name === undefined)
            throw new NotFoundException("Default collection name is undefined!")

        const quizExists = await this.quizService.findQuizByIdOrNull(quiz_id)
        this.logger.log("QUIZ: "+ quizExists?.id)

        const userExists = await this.userService.findUserByEmailOrNull(process.env.DEFAULT_USER_EMAIL!)
        this.logger.log("USER: "+ userExists?.id)

        

        let userId = userExists?.id
        
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

            const data: Question[] = questionData.map(q => {
                const options = q.options.map(o => ({id: uuidv4(), option: o.text }))

                const correctOption = options[q.answer - 1].id
                return {
                    quiz_id,
                    type: q.type,
                    category: q.category,
                    category_display_name: q.category_display_name,
                    question: q.text,
                    answer: q.answer,
                    options: options,
                    correct_option: correctOption
                }
            });

            const operations: OperationInput[] =  data.map(q => ({
                    operationType: "Upsert",
                    resourceBody: q as unknown as JSONObject,  
            }))
                
        
            
            this.cosmosContainer.items.executeBulkOperations(operations)

            for (const item of data) {
                await this.cosmosContainer.items.upsert(item)
            }   
            // If the default quiz doesn't exists create the quiz and the author profile
            // Get question categories 
            //const categories_display_name = await this.quizService.getCategoriesDisplayNamesForQuiz(quiz_id)
            const categories_display_name = [...new Set(data.map(d => d.category_display_name))]
            this.logger.log(`Categories display name: ${categories_display_name}`)

            await this.quizService.createQuizWithSpecificId(userId!, quiz_name, quiz_id, categories_display_name)
        }
    }
}   


export interface Question {
    quiz_id: string;
    type: string | undefined;
    category: string | undefined;
    category_display_name: string;
    question: string;
    options: { id: string; option: string }[];
    answer: number;
    correct_option: string
}
