import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'node:fs';
import * as cors from 'cors'


async function bootstrap() {
    const appOptions = {} as any;
    if (process.env.SSL && process.env.SSL === 'true') {
        console.log('SSL ENABLED');
        appOptions.httpsOptions = {
            key: fs.readFileSync(process.env.SSL_KEY),
            cert: fs.readFileSync(process.env.SSL_CERT),
        };
    }

    const app = await NestFactory.create(AppModule,appOptions);
    app.use(cors({ credentials: true, origin: true }))
    await app.listen(process.env.PORT);
}
bootstrap();
