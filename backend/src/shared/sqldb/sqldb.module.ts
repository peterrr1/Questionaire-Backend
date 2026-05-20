import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const dbType = configService.get<string>('DB_TYPE') ?? 'postgres'

                if (dbType === 'mssql') {
                    return {
                        type: 'mssql' as const,
                        host: configService.getOrThrow<string>('MSSQL_DB_HOST'),
                        database: configService.getOrThrow<string>('MSSQL_DB_NAME'),
                        authentication: {
                            type: 'azure-active-directory-default' as const,
                            options: {}
                        },
                        options: { encrypt: true, trustServerCertificate: false },
                        autoLoadEntities: true,
                        synchronize: true
                    }
                }

                return {
                    type: 'postgres' as const,
                    host: configService.get<string>('PGSQL_DB_HOST'),
                    port: configService.get<number>('PGSQL_DB_PORT'),
                    username: configService.get<string>('PGSQL_DB_USER'),
                    password: configService.get<string>('PGSQL_DB_PASSWORD'),
                    database: configService.get<string>('PGSQL_DB_NAME_DEV'),
                    autoLoadEntities: true,
                    synchronize: true
                }
            }
        })
    ]
})
export class SQLDatabaseModule {}
