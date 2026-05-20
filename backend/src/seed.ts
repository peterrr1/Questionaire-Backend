import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SeederService } from "./modules/common/seeder/seeder.service";

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule)
    await app.get(SeederService).run()
    await app.close()
    process.exit(0)
}
bootstrap()