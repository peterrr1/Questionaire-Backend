import { CosmosClient } from "@azure/cosmos";
import { DefaultAzureCredential, ManagedIdentityCredential } from "@azure/identity";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class CosmosDBService implements OnModuleInit {
    constructor(
        private readonly configService: ConfigService
    ) {}
    private client!: CosmosClient

    onModuleInit() {
        const credential = new DefaultAzureCredential();

        const client = new CosmosClient({
            endpoint: this.configService.getOrThrow<string>("COSMOS_DB_ENDPOINT"),
            aadCredentials: credential
        })
        this.client = client
    }

    private getDatabase() {
        const databaseName: string = this.configService.getOrThrow<string>("COSMOS_DB_NAME")

        const database = this.client.database(databaseName)
        return database
    }

    getContainer(containerName: string) {

        const database = this.getDatabase()

        const container = database.container(containerName)

        return container
    }

}