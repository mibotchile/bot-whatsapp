import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'node:fs';
import * as cors from 'cors'
import { json, urlencoded } from 'express';


async function bootstrap() {
    const appOptions = {} as any;
    if (process.env.SSL && process.env.SSL === 'true') {
        console.log('SSL ENABLED');
        appOptions.httpsOptions = {
            key: fs.readFileSync(process.env.SSL_KEY),
            cert: fs.readFileSync(process.env.SSL_CERT),
        };
    }

    const app = await NestFactory.create(AppModule, appOptions);
    app.use(cors({ credentials: true, origin: true }))
    app.use(json({ limit: '100mb' }));
    app.use(urlencoded({ extended: true, limit: '100mb' }));
    await app.listen(process.env.PORT);
}
bootstrap();
