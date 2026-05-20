import { DefaultEntity } from "src/modules/common/entities/default.entity";
import { QuizEntity } from "src/modules/quiz/entities/quiz.entity";
import { Column, Entity, OneToMany } from "typeorm";


@Entity()
export class UserEntity extends DefaultEntity {

    @Column({unique: true})
    email: string

    @Column({unique: true})
    username: string

    @Column()
    password: string

    @Column({ type: 'text', nullable: true, default: null})
    refreshToken: string | null

    @Column({type: 'datetime', nullable: true, default: null})
    refreshTokenExpiry: Date | null

    @Column()
    profilePictureUrl: string

    @OneToMany(() => QuizEntity, (quiz) => quiz.author)
    quizzes: QuizEntity[]
}