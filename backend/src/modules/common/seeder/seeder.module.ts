import { QuizModule } from "src/modules/quiz/quiz.module";
import { UserModule } from "src/modules/user/user.module";
import { SeederService } from "./seeder.service";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    ConfigModule,
    UserModule,
    QuizModule,
  ],
  providers: [SeederService],
  exports: [SeederService]
})
export class SeederModule {}
