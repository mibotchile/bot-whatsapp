import { Injectable } from '@nestjs/common'
import { SessionService } from 'src/session/session.service';
@Injectable()
export class MessageService {

    constructor(private sessionService: SessionService) {

    }

    async send(data: any) {
        const { client } = this.sessionService.findClientByWid(data.from)
        await client.sendText(data.to, data.body)
    }

}
