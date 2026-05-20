import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CosmosDBService } from './cosmosdb.service';

@Global()
@Module({
    imports: [
        ConfigModule
    ],
    exports: [CosmosDBService],
    providers: [CosmosDBService]
})
export class CosmosDBModule {}
