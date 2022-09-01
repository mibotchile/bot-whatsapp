import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { SessionService } from 'src/session/session.service';

@Injectable()
export class MessageService {

    constructor(@Inject(forwardRef(()=>SessionService)) private sessionService: SessionService) {
    }

    async send(data: { from: string, to: string, body: string }) {
        const session = this.sessionService.findByWid(data.from)
        if (!session) {
            throw new HttpException({ success: false, message: 'No existe session con este numero' }, HttpStatus.NOT_ACCEPTABLE)
        }
        const message = await session.whatsapp.sendText(data.to, data.body)
        return { sid: message.id.split('_')[2], ...message }
    }

}
