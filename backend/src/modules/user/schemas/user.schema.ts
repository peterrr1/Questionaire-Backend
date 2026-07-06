
export interface UserDocument {
    id: string
    email: string
    username: string
    password: string
    refresh_token: string | null
    refresh_token_expiry: string | null
    created_at: string
}
