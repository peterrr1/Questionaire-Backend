export interface QuizAuthor {
    id: string
    username: string
    created_at: string
}

export interface QuizDocument {
    id: string
    quiz_id: string
    name: string
    visibility: string
    question_types: string[]
    types_display_name: string[]
    created_at: string
    author: QuizAuthor
}
