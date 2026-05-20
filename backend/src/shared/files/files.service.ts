import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'typeorm/platform/PlatformTools.js';

@Injectable()
export class FilesAzureService {
    constructor(private readonly configService: ConfigService) {}
    private containerName: string

    private async getBlobServiceInstance(): Promise<BlobServiceClient> {
        const connectionString = this.configService.get('AZURE_CONNECTION_STRING')
        const blobClientService = BlobServiceClient.fromConnectionString(connectionString)

        return blobClientService
    }

    private async getBlobClient(fileName: string): Promise<BlockBlobClient> {
        const blobService = await this.getBlobServiceInstance()
        const containerName = this.containerName
        const containerClient = blobService.getContainerClient(containerName)
        await containerClient.createIfNotExists()
        const blockBlobClient = containerClient.getBlockBlobClient(fileName)
        
        return blockBlobClient
    }


    async uploadFile(file: Express.Multer.File, containerName: string): Promise<string> {
        this.containerName = containerName
        const extension = file.originalname.split('.').pop()
        const fileName = uuidv4() + '.' + extension
        const blockBlobClient = await this.getBlobClient(fileName)
        
        await blockBlobClient.uploadData(file.buffer)

        return blockBlobClient.url
    }


    async uploadDefaultAvatar(userId: string): Promise<string> {
        this.containerName = 'media'

        const defaultImagePath = path.join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'assets',
            'default_woman_avatar.png'
        )

        const blobName = `users/${userId}/avatar/avatar.png`
        const blockBlobClient = await this.getBlobClient(blobName)
        
        const fileBuffer = fs.readFileSync(defaultImagePath)
        await blockBlobClient.uploadData(fileBuffer, {
            blobHTTPHeaders: { blobContentType: 'image/png' }
        })

        return blockBlobClient.url
    }


    async uploadDefaultQuizImage(quizId: string): Promise<string> {
        this.containerName = "media"
        const defaultImagePath = path.join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'assets',
            'default-questionnaire-image.png'
        )

        const blobName = `quiz/${quizId}/display-image/display-image.png`
        const blockBlobClient = await this.getBlobClient(blobName)


        const fileBuffer = fs.readFileSync(defaultImagePath)
        await blockBlobClient.uploadData(fileBuffer, {
            blobHTTPHeaders: { blobContentType: 'image/png' }
        })

        return blockBlobClient.url
    }

    
    async uploadDocument() {

    }


    async getQuizImage(quizId: string): Promise<StreamableFile> {
        this.containerName = "media"
        const blobName = `quiz/${quizId}/display-image/display-image.png`
        
        const blockBlobClient = await this.getBlobClient(blobName)

        const exists = await blockBlobClient.exists()

        if(!exists) {
            throw new NotFoundException("Quiz display image not found!")
        }

        const file = await blockBlobClient.download()

        return new StreamableFile(file.readableStreamBody as unknown as Readable, {
            type: "image/png",
            disposition: "inline",
            length: file.contentLength
        })
    }
}
