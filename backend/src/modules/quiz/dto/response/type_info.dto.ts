import { Expose } from "class-transformer";

export class TypeInfoDto {
    @Expose()
    categories: string[]

    @Expose()
    category_display_names: string[]
}