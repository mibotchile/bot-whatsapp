import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { SessionService } from 'src/session/session.service';

@Injectable()
export class ChatService {

    constructor(private sessionService: SessionService) {
    }

    async remove(data: { whatsappNumber: string, chatNumber: string }) {
        const session = this.sessionService.findByWid(data.whatsappNumber)
        if (!session) {
            throw new HttpException({ success: false, message: 'No existe session con este numero' }, HttpStatus.NOT_ACCEPTABLE)
        }
        try {
            await session.whatsapp.deleteChat(data.chatNumber + '@c.us')
            return true
        } catch (error) {
            console.log('ERROR AL ELIMINAR EL CHAT', error);
            return false

        }
    }

}
