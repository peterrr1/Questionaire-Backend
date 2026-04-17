import { QuizModule } from "src/modules/quiz/quiz.module";
import { UserModule } from "src/modules/user/user.module";
import { SeederService } from "./seeder.service";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule,
    UserModule,
    QuizModule
  ],
  providers: [SeederService],
  exports: [SeederService]
})
export class SeederModule {}
