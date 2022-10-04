import { Body, Controller, Post } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @Post('sendText')
    async sendtextMessage(@Body() data: any) {
        console.log('DATA RECIBIDA ANTES DE ENVIAR EL MENSAJE', data);

        return await this.messageService.sendText(data)
    }

    @Post('sendFile')
    async sendFile(@Body() data: any) {
        return await this.messageService.sendFile(data)
    }
}
