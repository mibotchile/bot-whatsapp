import { Body, Controller, Post, Put, HttpException, HttpStatus } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @Post()
    async create(@Body() data: any) {
        const res = await this.sessionService.createClient(data)
        if (!res.success) {
            throw new HttpException(res, HttpStatus.NOT_ACCEPTABLE)
        }
        return res
    }

    @Put('start')
    async restart(@Body() data: any) {
        const res = await this.sessionService.openClient(data)
        if (!res.success) {
            throw new HttpException(res, HttpStatus.NOT_ACCEPTABLE)
        }
        return res
    }

    @Put('shutdown')
    async close(@Body() data: any) {
        const res = await this.sessionService.closeClient(data)
        if (!res.success) {
            throw new HttpException(res, HttpStatus.NOT_ACCEPTABLE)
        }
        return res
    }
}
