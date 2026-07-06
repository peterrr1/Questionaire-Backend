import { Expose, Type, ClassConstructor } from "class-transformer";


class OptionDto {
    @Expose()
    id: string

    @Expose()
    option: string
}

export class QuestionDto {
    @Expose()
    id: string

    @Expose()
    quiz_id: string

    @Expose()
    type: string

    @Expose()
    question: string

    @Expose()
    category: string

    @Expose()
    category_display_name: string
}

export class SingleOptionQuestionDto extends QuestionDto {
    @Expose()
    correct_option: string

    @Expose()
    @Type(() => OptionDto)
    options: OptionDto[]
}


export class ImageDescriptionQuestionDto extends QuestionDto {
    @Expose()
    url: string

    @Expose()
    answer: string
}


export class DatePickerQuestionDto extends QuestionDto {
    @Expose()
    start_date: string

    @Expose()
    end_date: string
}


export class SpeakingTopicQuestionDto extends QuestionDto {
    @Expose()
    topic_description: string
}


export const QUESTION_DTO_BY_TYPE: Record<string, ClassConstructor<QuestionDto>> = {
    SINGLE_OPTION: SingleOptionQuestionDto,
    IMAGE_DESCRIPTION: ImageDescriptionQuestionDto,
    DATE_PICKER: DatePickerQuestionDto,
    SPEAKING_TOPIC: SpeakingTopicQuestionDto,
}
