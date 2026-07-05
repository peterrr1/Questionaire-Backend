import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type QuestionDocument = HydratedDocument<Question>

export class Option {   
    id: string
    option: string
}

@Schema({ collection: 'questions', discriminatorKey: 'type' })
export class Question {
    @Prop({required: true, index: true})
    quiz_id: string

    @Prop({required: true})
    question: string
    
    @Prop({
        required: true,
        enum: ['SINGLE_OPTION', 'IMAGE_DESCRIPTION', 'DATE_PICKER', 'SPEAKING_TOPIC']
    })
    type: string
}
export const QuestionSchema = SchemaFactory.createForClass(Question)
QuestionSchema.index({ type: 1 })


@Schema()
export class SingleOptionQuestion {
    @Prop({required: true})
    category: string

    @Prop({required: true})
    category_display_name: string

    @Prop({required: true})
    correct_option: string

    @Prop([Option])
    options: Option[]
}

export const SingleOptionQuestionSchema = SchemaFactory.createForClass(SingleOptionQuestion)
SingleOptionQuestionSchema.index({ category: 1 })


@Schema()
export class ImageDescriptionQuestion {
    @Prop({
        required: true
    })
    url: string

    @Prop({
        required: true
    })
    answer: string
}

export const ImageDescriptionQuestionSchema = SchemaFactory.createForClass(ImageDescriptionQuestion)


@Schema()
export class DatePickerQuestion {
    @Prop({
        required: true
    })
    start_date: Date

    @Prop({
        required: true
    })
    end_date: Date
}

export const DatePickerQuestionSchema = SchemaFactory.createForClass(DatePickerQuestion)


@Schema()
export class SpeakingTopicQuestion {
    @Prop({
        required: true
    })
    topic_description: string
}

export const SpeakingTopicQuestionsSchema = SchemaFactory.createForClass(SpeakingTopicQuestion)

