import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { Readable } from 'typeorm/platform/PlatformTools.js';


const MEDIA_CONTAINER = 'media';
const ASSETS_DIR = path.join(__dirname, '..', '..', '..', '..', 'assets');


@Injectable()
export class FilesAzureService {
    private readonly blobService: BlobServiceClient

    constructor(configService: ConfigService) {
        this.blobService = BlobServiceClient.fromConnectionString(
            configService.getOrThrow<string>("AZURE_CONNECTION_STRING")
        )
    }


    private getBlobClient(container_name: string, blob_name: string): BlockBlobClient {
        return this.blobService
            .getContainerClient(container_name)
            .getBlockBlobClient(blob_name)
    }

    private async uploadAsset(asset_file_name: string, blob_name: string): Promise<void> {
        const buffer = await readFile(path.join(ASSETS_DIR, asset_file_name));
        await this.getBlobClient(MEDIA_CONTAINER, blob_name).uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: 'image/png' }
        })

    }

    async uploadFile(file: Express.Multer.File, container_name: string): Promise<string> {
        const extension = file.originalname.split('.').pop()
        const blob_name = `${uuidv4()}.${extension}`

        await this.getBlobClient(container_name, blob_name).uploadData(file.buffer, {
            blobHTTPHeaders: { blobContentType: file.mimetype }
        })
        
        return blob_name
    }


    async uploadDefaultAvatar(user_id: string): Promise<void> {
        await this.uploadAsset('default_woman_avatar.png', `users/${user_id}/avatar/avatar.png`);
    }

    async deleteUserAvatar(user_id: string): Promise<void> {
        await this.getBlobClient(MEDIA_CONTAINER, `users/${user_id}/avatar/avatar.png`).deleteIfExists();
    }



    async uploadDefaultQuizImage(quiz_id: string): Promise<void> {
        await this.uploadAsset('default-questionnaire-image.png', `quiz/${quiz_id}/display-image/display-image.png`);
    }

    async deleteQuizImage(quiz_id: string): Promise<void> {
        await this.getBlobClient(MEDIA_CONTAINER, `quiz/${quiz_id}/display-image/display-image.png`).deleteIfExists();
    }

    
    async getQuizImage(quiz_id: string): Promise<StreamableFile> {
        const blob_client = this.getBlobClient(
            MEDIA_CONTAINER,
            `quiz/${quiz_id}/display-image/display-image.png`
        );

        const exists = await blob_client.exists();
        if (!exists) {
            throw new NotFoundException('Quiz display image not found!');
        }

        const file = await blob_client.download();
        return new StreamableFile(file.readableStreamBody as unknown as Readable, {
            type: 'image/png',
            disposition: 'inline',
            length: file.contentLength
        });
    }
}
