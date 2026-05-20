import { Exclude, Expose, Type } from "class-transformer";
import { IsString, ValidateNested } from "class-validator";

@Exclude()
export class QuestionDto {
    @Expose()
    @IsString()
    id: string

    @Expose()
    @IsString()
    quiz_id: string

    @Expose()
    @IsString()
    type: string

    @Expose()
    @IsString()
    category: string

    @Expose()
    @IsString()
    category_display_name: string

    @Expose()
    @IsString()
    question: string

    @Expose()
    @IsString()
    correct_option: string

    @Expose()
    @ValidateNested({each: true})
    @Type(() => OptionDto)
    options: OptionDto[]
}

@Exclude()
export class OptionDto {
    @Expose()
    @IsString()
    id: string

    @Expose()
    @IsString()
    option: string
}
