import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type QuestionDocument = HydratedDocument<Question>

export class Option {
    _id: string
    option: string
}

@Schema()
export class Question {
    @Prop()
    type: string

    @Prop()
    category: string

    @Prop()
    question: string

    @Prop()
    correct_option: string

    @Prop([Option])
    options: Option[]
}


export const QuestionSchema = SchemaFactory.createForClass(Question)
