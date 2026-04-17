import { Global, Module } from '@nestjs/common';
import { FilesAzureService } from './files.service';
import { FilesController } from './files.controller';

@Global()
@Module({
    providers: [FilesAzureService],
    exports: [FilesAzureService],
    controllers: [FilesController]
})
export class FilesModule {}
