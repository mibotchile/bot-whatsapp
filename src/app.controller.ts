import { Body, Controller, Get, Post, Put, Query, HttpException, HttpStatus, Inject, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get(':clientNumber/message/:text')
    async sendtextMessage(@Param('clientNumber') clientNumber: string, @Param('text') text: string) {
        return await this.appService.sendTextMessage(clientNumber, text);
    }
    @Get(':clientNumber/buttons/:text')
    async sendButtonsMessage(@Param('clientNumber') clientNumber: string, @Param('text') text: string) {
        return await this.appService.sendButtonMessage(clientNumber, text);
    }

    @Get('seenChat/:chatId')
    async seenChat(@Param('chatId') chatId: string) {
        return await this.appService.seenChat(chatId);
    }
}
