export interface Option {   
    id: string
    option: string
}

interface QuestionBase {
    id: string
    quiz_id: string
    question: string
    type: string
    category: string
    category_display_name: string
}

export interface SingleOptionQuestion extends QuestionBase {
    correct_option: string
    options: Option[]
}


export interface ImageDescriptionQuestion extends QuestionBase {
    url: string
    answer: string
}


export interface DatePickerQuestion extends QuestionBase {
    start_date: Date
    end_date: Date
}

export interface SpeakingTopicQuestion extends QuestionBase {
    topic_description: string
}


export type QuestionDocument =
    | SingleOptionQuestion
    | ImageDescriptionQuestion
    | DatePickerQuestion
    | SpeakingTopicQuestion
