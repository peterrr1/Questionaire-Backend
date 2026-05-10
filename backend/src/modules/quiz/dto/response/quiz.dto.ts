import { UserDto } from "src/modules/user/dto/response/user.dto"
import { Visibility } from "src/modules/common/enums/enum.common"
import { Exclude, Expose } from "class-transformer"
import { IsString } from "class-validator"


@Exclude()
export class QuizInfoDto {
    @Expose()
    @IsString()
    quiz_id: string
    
    @Expose()
    @IsString()
    name: string

    @Expose()
    visibility: Visibility

    @Expose()
    author: UserDto

    @Expose()
    question_categories: Array<string>

    @Expose()
    categories_display_name: Array<string>

    @Expose()
    editable: boolean
}


