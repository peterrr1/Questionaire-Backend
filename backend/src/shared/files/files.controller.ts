import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { FilesAzureService } from './files.service';

@Controller('files')
export class FilesController {
    constructor(private filesService: FilesAzureService) {}

    @Get(':quiz_id/image')
    async getQuizDisplayImage(@Param('quiz_id') quizId: string): Promise<StreamableFile> {
        return this.filesService.getQuizImage(quizId)
    }

}
