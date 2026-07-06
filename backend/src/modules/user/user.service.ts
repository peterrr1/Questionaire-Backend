import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '../auth/dto/request/register.dto';
import { UserDto } from './dto/response/user.dto';
import { plainToClass } from 'class-transformer';
import { use } from 'passport';
import { FilesAzureService } from 'src/shared/files/files.service';
import { v4 as uuidv4 } from 'uuid';
import { CosmosDBService } from 'src/shared/cosmosdb/cosmosdb.service';
import { Container, ErrorResponse, SqlQuerySpec, User } from '@azure/cosmos';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from './schemas/user.schema';
import { PatchOperation } from 'node_modules/@azure/cosmos/dist/esm';

@Injectable()
export class UserService implements OnModuleInit {
    constructor(
        private cosmosDb: CosmosDBService, 
        private filesService: FilesAzureService,
        private configService: ConfigService
    ) {}

    private userContainer!: Container

    
    onModuleInit() {
        const userContainerName: string = this.configService.getOrThrow<string>("COSMOS_DB_USER_CONTAINER_NAME")

        this.userContainer = this.cosmosDb.getContainer(userContainerName)
    }


    async getAllUsers() {
        const querySpec: SqlQuerySpec = {
            query: "SELECT u.id, u.email, u.username, u.profile_picture_url, u.created_at from u"
        }

        const { resources } = await this.userContainer.items
        .query<UserDocument>(querySpec).fetchAll()
        
        if (resources.length === 0) {
            throw new NotFoundException("There are no users.")
        }

        return resources.map(user => plainToClass(UserDto, user, {
            excludeExtraneousValues: true
        }))
    }



    async findUserById(id: string): Promise<UserDocument> {
        const { resource } = await this.userContainer
            .item(id, id).read<UserDocument>()

        if (resource === undefined)
            throw new NotFoundException("User with the given id does not exists!")

        return resource
    }



    async findUserByEmailOrNull(email: string): Promise<UserDocument> {
        const querySpec: SqlQuerySpec = {
            query: "SELECT * from u WHERE u.email = @email",
            parameters: [
                { name: "@email", value: email }
            ]
        }

        const { resources } = await this.userContainer.items
            .query(querySpec).fetchNext()
        
            return resources[0] ?? null
    }



    async findUserByEmailOrThrow(email: string): Promise<UserDocument> {
        const user = await this.findUserByEmailOrNull(email)
        if (user === null) {
            throw new NotFoundException(`User with email ${email} was not found`)
        }
        return user
    }



    
    async updateUserData(id: string, data: Partial<UserDocument>): Promise<void> {
        const operations: PatchOperation[] = Object.entries(data)
            .map(([key, value]) => ({
                op: 'set',
                path: `/${key}`,
                value: value ?? null
            }))

        try {
            await this.userContainer.item(id, id).patch(operations)
        } catch (e) {
            if (e instanceof ErrorResponse && e.code === 404) {
                throw new NotFoundException(`User with id ${id} does not exist!`) 
            }
            throw e    
        }
    }
    


    async deleteUserById(id: string): Promise<void> {
        try {
            await this.userContainer.item(id, id).delete()
        } catch (e) {
            if (e instanceof ErrorResponse && e.code === 404) {
                 throw new NotFoundException(`User with id: ${id} doesn't exist`)
            }
            throw e
        }
        await this.filesService.deleteUserAvatar(id)
    }



    async createUser(user_data: RegisterUserDto): Promise<UserDocument> {
         const querySpec: SqlQuerySpec = {
            query: "SELECT TOP 1 * FROM u WHERE u.email = @email OR u.username = @username",
            parameters: [
                { name: "@email", value: user_data.email },
                { name: "@username", value: user_data.username }
            ]
        }

        const { resources: conflicts } = await this.userContainer.items
            .query<UserDocument>(querySpec).fetchNext()
        
        const existing = conflicts[0]

        if (existing !== undefined) {
            throw new BadRequestException(
                existing.email === user_data.email ? "Email is already in use!" : "Username is already in use!"
            )
        }

        const hashed_password = await bcrypt.hash(user_data.password, 10)

        const user_id = uuidv4()

        const new_user: UserDocument = {
            id: user_id,
            email: user_data.email,
            username: user_data.username,
            password: hashed_password,
            refresh_token: null,
            refresh_token_expiry: null,
            created_at: new Date().toISOString()
        }

        const { resource } = await this.userContainer.items.create(new_user)

        await this.filesService.uploadDefaultAvatar(user_id)

        return resource!
    }
}
