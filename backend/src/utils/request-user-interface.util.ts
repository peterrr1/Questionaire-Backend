export interface RequestUser {
    id: string
    email: string
}

export interface RequestUserWithRefresh extends RequestUser {
    refreshToken: string
}