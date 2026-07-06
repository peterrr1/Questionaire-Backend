// backend/src/modules/quiz/dto/response/quiz.dto.ts
import { Expose, Transform, Type } from 'class-transformer'

export class QuizAuthorDto {
    @Expose()
    username: string

    @Expose()
    created_at: string
}

export class QuizDto {
    @Expose()
    quiz_id: string

    @Expose()
    name: string

    @Expose()
    visibility: string

    @Expose()
    question_types: string[]

    @Expose()
    types_display_name: string[]

    @Expose()
    created_at: string

    @Expose()
    @Type(() => QuizAuthorDto)
    author: QuizAuthorDto

    @Expose()
    @Transform(({ obj }) => `/files/quiz/${obj.quiz_id}/image`)
    display_image_url: string
}