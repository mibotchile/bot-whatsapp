import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { SessionService } from 'src/session/session.service';

@Injectable()
export class ChatService {
   
    constructor(private sessionService: SessionService) {
    }

    async remove(data:{whatsappNumber:string,chatNumber:string}) {
        const wppClient = this.sessionService.findClientByWid(data.whatsappNumber)
        if(!wppClient){
            throw new HttpException({success:false,message:'No existe session con este numero'},HttpStatus.NOT_ACCEPTABLE)
        }
        return await wppClient.client.deleteChat(data.chatNumber+'@c.us')
    }

}
