import { Body, Controller, Put, HttpException, HttpStatus, Get, Param } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
    constructor(private sessionService: SessionService) { }

    @Get()
    async findAll() {
        return this.sessionService.findAll()
    }

    @Get('qrCode')
    async getQr() {
        return this.sessionService.getQrCode()
    }

    @Get('id/:sessionId')
    findById(@Param('sessionId') sessionId: string) {
        const session = this.sessionService.findById(sessionId)
        if(!session){
            throw new HttpException({message:'No existe session con este id'}, HttpStatus.NOT_ACCEPTABLE)
        }
        return {
            id: session.id,
            wid: session.wid,
            webhook: session.webhook,
            state: session.state
        }
    }

    @Get('wid/:wid')
    findByWid(@Param('wid') wid: string) {
        const session = this.sessionService.findByWid(wid)
        return {
            id: session.id,
            wid: session.wid,
            webhook: session.webhook,
            state: session.state
        }
    }

    // @Put('forceRefreshQrCode')
    // async forceRefreshQrCode() {
    //     return this.sessionService.getQrCode()
    // }

    @Put('start') //esto inicia o reinicia la instancia de chrome
    async restart(@Body() data: any) {
        const res = await this.sessionService.startClient(data)
        if (!res.success) {
            throw new HttpException(res, HttpStatus.NOT_ACCEPTABLE)
        }
        return res
    }

    @Put('shutdown') //esto cierra la instancia de chrome
    async close(@Body() data: any) {
        const res = await this.sessionService.closeClient(data)
        if (!res.success) {
            throw new HttpException(res, HttpStatus.NOT_ACCEPTABLE)
        }
        return res
    }

    @Put('logout')
    async logout(@Body() data: any) {// esto cierra la session o desvincula el dispositivo
        const res = await this.sessionService.logout(data)
        if (!res.success) {
            throw new HttpException(res, HttpStatus.NOT_ACCEPTABLE)
        }
        return res
    }

    @Put('/webhook')
    async changeWebhook(@Body() data: any) {
        const res = this.sessionService.updateWebhook(data.id, data.webhook)
        if (!res) {
            throw new HttpException({ message: 'Error al cambiar el webhook', success: false }, HttpStatus.NOT_ACCEPTABLE)
        }
        return { message: 'Webhook actualizado exitosamente', success: true }
    }

}
