import { DefaultEntity } from "src/modules/common/entities/default.entity";
import { Visibility } from "src/modules/common/enums/enum.common";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { BeforeInsert, Column, Entity, ManyToOne } from "typeorm";
import { v4 as uuidv4 } from 'uuid';



@Entity()
export class QuizEntity extends DefaultEntity {
    @Column()
    name: string
    
    @Column({unique: true})
    collection_id: string

    @Column({
        type: "enum",
        enum: Visibility,
        default: Visibility.PUBLIC
    })
    visibility: Visibility

    @Column()
    displayImageUrl: string

    @ManyToOne(() => UserEntity, (user) => user.quizzes)
    author: UserEntity

    @BeforeInsert()
    generateCollectionId() {
        if (this.collection_id == null)
            this.collection_id = `quiz_${uuidv4()}`
    }

}