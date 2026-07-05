
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument } from "mongoose"

export type UserDocument = HydratedDocument<User>

@Schema({ collection: 'user' })
export class User {
    @Prop({ required: true, index: true})
    email: string

    @Prop({required: true})
    username: string

    @Prop({required: true})
    password: string

    @Prop({required: true})
    refreshToken: string

    @Prop()
    refreshTokenExpiry: Date | null

    @Prop()
    created_at: Date | null

    
}


export const UserSchema = SchemaFactory.createForClass(User)
UserSchema.index({ email: 1 })