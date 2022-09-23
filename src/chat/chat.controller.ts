import { Body, Controller, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Delete()
    async sendtextChat(@Body() data: any) {
        console.log('eliminando chat');
        const response=await this.chatService.remove(data)
        console.log('[RESPONSE]',response);

        return response
    }
}
