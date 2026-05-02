import { Exclude, Expose, Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Option } from "../../schemas/question.schema";

/*
data class QuizDraftDto(
    @field:Json(name = "quiz_information") val quizName: QuizInformationDraftDto,
    @field:Json(name = "questions") val questions: List<QuestionDraftDto>
)


data class QuizInformationDraftDto(
    @field:Json(name = "quiz_name") val name: String,
    @field:Json(name = "visibility") val visibility: String,
    @field:Json(name = "question_categories") val questionCategories: List<String>
)

data class QuestionDraftDto(
    @field:Json(name = "type") val type: String,
    @field:Json(name = "category") val category: String,
    @field:Json(name = "question") val text: String,
    @field:Json(name = "options") val options: List<OptionDraftDto>,
    @field:Json(name = "correct_option") val correctOptionId: String,
)

data class OptionDraftDto(
    @field:Json(name = "option") val option: String
)
*/

class OptionDraftDto {

    @IsString()
    option: string
}

class QuestionDraftDto {

    @IsString()
    @IsIn(['SINGLE_OPTION', 'MULTIPLE_OPTION'])
    type: string


    @IsString()
    @IsNotEmpty()
    category: string


    @IsString()
    @IsNotEmpty()
    question: string


    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => OptionDraftDto)
    options: OptionDraftDto[]

    @IsInt()
    @IsNotEmpty()
    correct_option: number
}



class QuizInformationDraftDto {

    @IsString()
    @IsNotEmpty()
    quiz_name: string


    @IsString()
    @IsIn(['Public', 'Private'])
    visibility: string


    @IsArray()
    @IsString({ each: true })
    question_categories: string[]
}
@Exclude()
export class QuizDraftDto {
    
    @Expose()
    @ValidateNested()
    @Type(() => QuizInformationDraftDto)
    quiz_information: QuizInformationDraftDto

    @Expose()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => QuestionDraftDto)
    questions: QuestionDraftDto[]
}

