import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type QuizDocument = HydratedDocument<Quiz>

@Schema({ collection: 'quiz' })
export class Quiz {
    @Prop({required: true, index: true})
    quiz_id: string

    @Prop({ required: true, index: true})
    name: string

    @Prop({required: true})
    visibility: string

    @Prop({required: true})
    question_catgegories: string[]

    @Prop({required: true})
    categories_display_name: string[]

    @Prop()
    display_image_ulr: string

    @Prop()
    created_at: Date

    @Prop()
    author_id: string
}


export const QuizSchema = SchemaFactory.createForClass(Quiz)
QuizSchema.index({ name: 1 })

