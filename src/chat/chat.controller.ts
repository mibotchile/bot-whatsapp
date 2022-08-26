import { Body, Controller, Get, Post, Put, Query, HttpException, HttpStatus, Inject, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post()
    async sendtextChat(@Body() data:any) {
        return await this.chatService.remove(data)
    }
}
