import { Body, Controller, Get, Post, Put, Query, HttpException, HttpStatus, Inject, Param } from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
    constructor(private readonly messageService: MessageService) {}

    @Post('send')
    async sendtextMessage(@Body() data:any) {
        console.log('DATA RECIBIDA ANTES DE ENVIAR EL MENSAJE',data);
        
        return await this.messageService.send(data)
    }
}
