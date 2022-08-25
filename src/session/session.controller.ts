import { Body, Controller, Get, Post, Put, Query, HttpException, HttpStatus, Inject, Param } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller()
export class SessionController {
    constructor(private readonly sessionService:SessionService) {}

    @Post()
    async create(@Body() data:any){
       await this.sessionService.createClient(data)
    }
}
