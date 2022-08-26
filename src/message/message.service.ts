import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { SessionService } from 'src/session/session.service';

@Injectable()
export class MessageService {

    constructor(private sessionService: SessionService) {
    }

    async send(data: { from: string, to: string, body: string }) {
        const wppClient = this.sessionService.findClientByWid(data.from)
        if (!wppClient) {
            throw new HttpException({ success: false, message: 'No existe session con este numero' }, HttpStatus.NOT_ACCEPTABLE)
        }
        // const message:Message&{sid:string}=await wppClient.client.sendText(data.to, data.body) as any
        const message = await wppClient.client.sendText(data.to, data.body)
        return { sid: message.id.split('_')[2], ...message }
    }

}
