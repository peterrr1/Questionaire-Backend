import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import { Connection, Mongoose } from 'mongoose';

@Global()
@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: () => ({
                uri: 'mongodb://admin:secret@localhost:27017/quiz_db?authSource=admin'
            }),
            inject: [ConfigService]
        })
    ]
})
export class MongodbModule {}
