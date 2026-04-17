import { Exclude, Expose } from "class-transformer"
import { IsString } from "class-validator"

@Exclude()
export class QuizInfoCompactDto {
    @Expose()
    @IsString()
    id: string

    @Expose()
    @IsString()
    name: string
}