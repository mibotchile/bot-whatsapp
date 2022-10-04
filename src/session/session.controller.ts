import { Body, Controller, Put, HttpException, HttpStatus, Get, Param, Query, Post } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
    constructor(private sessionService: SessionService) { }

    @Get()
    async findAll() {
        return this.sessionService.findAll()
    }

    @Get('qrCode')
    async getQr(@Query() { sessionId }: { sessionId: string | undefined }) {
        sessionId = sessionId === 'undefined' ? undefined : sessionId
        return this.sessionService.getQrCode(sessionId)
    }

    @Get('id/:sessionId')
    findById(@Param('sessionId') sessionId: string) {
        const session = this.sessionService.findById(sessionId)
        if (!session) {
            throw new HttpException({ message: 'No existe session con este id' }, HttpStatus.NOT_ACCEPTABLE)
        }

        const sessionState = session.state

        if (session.state === 'duplicated') {
            this.sessionService.changeSessionState(session.id, 'notLogged')
        }

        return {
            id: session.id,
            wid: session.wid,
            webhook: session.webhook,
            state: sessionState
        }
    }

    @Get('wid/:wid')
    findByWid(@Param('wid') wid: string) {
        const session = this.sessionService.findByWid(wid)
        if (!session) {
            throw new HttpException({ message: 'No existe session con este id' }, HttpStatus.NOT_ACCEPTABLE)
        }
        const sessionState = session.state

        if (session.state === 'duplicated') {
            this.sessionService.changeSessionState(session.id, 'notLogged')
        }

        return {
            id: session.id,
            wid: session.wid,
            webhook: session.webhook,
            state: sessionState
        }
    }

    @Put('webhook')
    async changeWebhook(@Body() data: any) {
        const res = this.sessionService.updateWebhook(data.id, data.webhook)
        if (!res) {
            throw new HttpException({ message: 'Error al cambiar el webhook', success: false }, HttpStatus.NOT_ACCEPTABLE)
        }
        return { message: 'Webhook actualizado exitosamente', success: true }
    }

    @Post('testNumber/:number')
    async addTestNumber(@Param('number') phoneNumber: string) {
        const res = this.sessionService.addTestNumber(phoneNumber)
        return { data: res, message: 'Numero de pruebas agregado exitosamente', success: true }
    }

}
