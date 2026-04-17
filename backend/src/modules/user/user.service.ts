import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '../auth/dto/request/register.dto';
import { UserDto } from './dto/response/user.dto';
import { plainToClass } from 'class-transformer';
import { use } from 'passport';
import { FilesAzureService } from 'src/shared/files/files.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private filesService: FilesAzureService
    ) {}


    async getAllUsers(): Promise<UserDto[]> {
        const users = await this.userRepository.find()
        return users.map(user => plainToClass(UserDto, user))
    }



    async findUserById(id: string): Promise<UserEntity> {
        const user = await this.userRepository.findOneBy({id})

        if (user === null)
            throw new NotFoundException("User with the given id does not exists!")

        return user
    }

    async getUserById(id: string): Promise<UserDto> {
        const user = await this.userRepository.findOneBy({id: id})
        if (user === null) {
            throw new NotFoundException("User with the given email is not found!")
        }
        return plainToClass(UserDto, user)
    }



    async findUserByEmailOrNull(email: string): Promise<UserEntity | null> {
        return await this.userRepository.findOneBy({email: email})
    }

    async findUserByEmailOrThrow(email: string): Promise<UserEntity> {
        const user = await this.findUserByEmailOrNull(email)
        if (user === null) {
            throw new NotFoundException(`User with email ${email} was not found`)
        }
        return user
    }


    async updateUserData(id: string, data: Partial<UserEntity>): Promise<void> {
        await this.userRepository.update(id, data)
    }
    


    async deleteUserById(uid: string): Promise<void> {
        const result = await this.userRepository.delete({id: uid})
        if (result.affected === 0) {
            throw new NotFoundException(`User with id: ${uid} doesn't exist`)
        }
    }



    async createUser(userData: RegisterUserDto): Promise<UserEntity> {
        const existing = await this.userRepository.findOneBy([{
            email: userData.email,
            username: userData.username
        }])
        if (existing) {
            throw new BadRequestException(
                existing.email === userData.email ? "Email is already in use!" : "Username is already in use!"
            )
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(userData.password, salt)

        const userId = uuidv4()

        const avatarUrl = await this.filesService.uploadDefaultAvatar(userId)

        const newUser = await this.userRepository.create({
            id: userId,
            email: userData.email,
            username: userData.username,
            password: hashedPassword,
            profilePictureUrl: avatarUrl
        })

        return await this.userRepository.save(newUser)
    }
}
