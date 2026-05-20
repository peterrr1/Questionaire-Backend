import { DefaultEntity } from "src/modules/common/entities/default.entity";
import { Visibility } from "src/modules/common/enums/enum.common";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { BeforeInsert, Column, Entity, ManyToOne } from "typeorm";
import { v4 as uuidv4 } from 'uuid';



@Entity()
export class QuizEntity extends DefaultEntity {
    @Column()
    name: string

    @Column({
        type: "simple-enum",
        enum: Visibility,
        default: Visibility.PUBLIC
    })
    visibility: Visibility

    @Column('simple-array')
    question_categories: string[]

    @Column('simple-array')
    categories_display_name: string[]

    @Column()
    displayImageUrl: string

    @ManyToOne(() => UserEntity, (user) => user.quizzes, {
        onDelete: 'CASCADE'
    })
    author: UserEntity
}