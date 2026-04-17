import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/response/user.dto';
import { use } from 'passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesAzureService } from 'src/shared/files/files.service';
import { JwtAccessTokenGuard } from '../auth/guards/access-token.guard';

@Controller('user')
export class UserController {
    constructor(
        private userService: UserService,
        private fileService: FilesAzureService
    ) {}

    @UseGuards(JwtAccessTokenGuard)
    @Get('account')
    async getProfile(@Request() req: any): Promise<UserDto> {
        return this.userService.getUserById(req.user.id)
    }

    @UseGuards(JwtAccessTokenGuard)
    @Delete('account')
    async deleteUserById(@Request() req: any): Promise<void> {
        return this.userService.deleteUserById(req.user.id)
    }
    
    @UseGuards(JwtAccessTokenGuard)
    @Get('list')
    async getAllUser(): Promise<UserDto[]> {
        return this.userService.getAllUsers()
    }

    @UseGuards(JwtAccessTokenGuard)
    @Get(':id')
    async getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<UserDto> {
        const user =  await this.userService.getUserById(id)
        console.log(user)
        return user
    }

}
