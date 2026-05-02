import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type QuestionDocument = HydratedDocument<Question>

export class Option {   
    _id: string
    option: string
}

@Schema()
export class Question {
    @Prop({required: true})
    type: string

    @Prop({required: true})
    category: string

    @Prop({required: true})
    category_display_name: string

    @Prop({required: true})
    question: string

    @Prop({required: true})
    correct_option: string


    @Prop([Option])
    options: Option[]
}


export const QuestionSchema = SchemaFactory.createForClass(Question)
