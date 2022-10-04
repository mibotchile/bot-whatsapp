import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request } from 'express';
import { textHex } from 'src/utils/cli-color';
import { now } from 'src/utils/date';

@Injectable()
export class RequestMiddleware implements NestMiddleware {

    use(req: Request, res: any, next: () => void) {
        const { ip, method, path: url } = req;
        const userAgent = req.get('user-agent') || '';
        console.log(textHex('ff8000', `[${now()}] ${method}: ${url} - ${userAgent} ${ip}`));
        next()
    }
}
