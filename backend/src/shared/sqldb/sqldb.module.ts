import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                host: configService.get('PGSQL_DB_HOST'),
                port: configService.get('PGSQL_DB_PORT'),
                username: configService.get('PGSQL_DB_USER'),
                password: configService.get('PGSQL_DB_PASSWORD'),
                database: configService.get('PGSQL_DB_NAME_DEV'),
                entities: ['dist/modules/**/*.entity{.ts,.js}'],
                synchronize: true
            })
        })
    ]
})
export class SQLDatabaseModule {}
