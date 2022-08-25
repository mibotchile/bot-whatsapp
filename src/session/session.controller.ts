import { Body, Controller,  Post, Put, Query, HttpException, HttpStatus, Inject, Param } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller()
export class SessionController {
    constructor(private readonly sessionService:SessionService) {}

    @Post()
    async create(@Body() data:any){
       const res=await this.sessionService.createClient(data)
       if(!res.success){
        throw new HttpException(res,HttpStatus.NOT_ACCEPTABLE)
       }
       return res
    }
}
