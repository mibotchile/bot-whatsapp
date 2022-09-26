import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
    Ack,
    create,
    Message,
    MessageType,
    StatusFind,
    Whatsapp,
} from '@wppconnect-team/wppconnect';
import * as fs from 'node:fs';
import axios, { Axios } from 'axios';
import * as https from 'node:https';
import { ScrapQrcode } from '@wppconnect-team/wppconnect/dist/api/model/qrcode';
import { RabbitMQService } from 'src/rabbit-mq/rabbit-mq.service';

interface WhatsappSession {
    id?: string;
    wid?: string;
    whatsapp?: Whatsapp;
    webhook?: string;
    state?: string;
}

@Injectable()
export class SessionService implements OnModuleDestroy {
    private axios: Axios;
    private sessions: WhatsappSession[] = [];

    private availableNumbers: string[] = [];
    private testNumbers: string[] = [];

    private qrCodeSessions: Array<ScrapQrcode & { sessionId: string }> = [];
    private onMessageEvents: { [key: string]: { dispose: () => void } } = {}
    private onAckEvents: { [key: string]: { dispose: () => void } } = {}

    constructor(
        private rabbitMQService: RabbitMQService
    ) {
        console.log('NEW SESSION SERVICE');

        if (fs.existsSync('whatsapp-clients.json')) {
            this.sessions = JSON.parse(fs.readFileSync('whatsapp-clients.json', 'utf-8'))
            this.init();
        }

        if (!fs.existsSync('available_numbers.json')) {
            this.updateAvailableNumbers();
        } else {
            this.availableNumbers = JSON.parse(fs.readFileSync('available_numbers.json', 'utf-8'))
        }

        if (!fs.existsSync('test_numbers.json')) {
            this.updateAvailableNumbers();
        } else {
            this.testNumbers = JSON.parse(fs.readFileSync('test_numbers.json', 'utf-8'))
        }

        this.axios = axios.create({
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });
    }


    private async init() {
        for (const session of this.sessions) {
            console.log(session);

            if (!session.wid) {
                await this.deleteSession(session.id)
                continue
            }
            await this.createClient(session.id);
        }
    }


    changeSessionState(sessionId: string, state: string) {
        const sessionIndex = this.sessions.findIndex((s) => s.id === sessionId);
        this.sessions[sessionIndex].state = state
    }

    uid(): string {
        return (Date.now() + Math.random() * 10000).toString(36).replace('.', '');
    }

    updateAvailableNumbers() {
        fs.writeFileSync('available_numbers.json', JSON.stringify(this.availableNumbers));
    }

    addTestNumber(phoneNumber: string) {
        this.testNumbers.push(phoneNumber)
        this.updateTestNumbers()
        return this.testNumbers
    }

    updateTestNumbers() {
        fs.writeFileSync('test_numbers.json', JSON.stringify(this.testNumbers));
    }

    findAll() {
        return this.sessions.map(({ id, wid, webhook, state }) => ({ id, wid, webhook, state }));
    }

    updateWebhook(id: string, newWebhook: string) {
        const sessionIndex = this.sessions.findIndex((s) => s.id === id);

        if (sessionIndex === -1) return false

        if (!this.sessions[sessionIndex].whatsapp) return false

        this.sessions[sessionIndex].webhook = newWebhook;
        this.updateClientsFileRepo();

        try {
            this.registerOnAckCallback(id);
            this.registerOnMessageCallback(id);
            return true;
        } catch (e) {
            console.log('WEBHOOK ERROR', e);
            return false;
        }
    }

    findById(sessionId: string) {
        return this.sessions.find((s) => s.id === sessionId);
    }

    private async createClient(id: string): Promise<{ data: any; message: string; success: boolean }> {

        if (this.sessions.length === 5) {
            return { data: [], success: false, message: 'No se puede crear mas de 5 sessiones' };
        }

        const sessionId = id
        const session = this.findById(sessionId);

        if (!session) {
            this.sessions.push({ id: sessionId });
            this.updateClientsFileRepo()
        }

        const whatsapp = await create({
            session: sessionId,
            catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
                console.log(`Waiting for QRCode Scan (Attempt ${attempts})...`, (new Date()).toLocaleString());

                const qrCodeIndex = this.qrCodeSessions.findIndex((qrc) => qrc.sessionId === sessionId);
                if (qrCodeIndex === -1) {
                    this.qrCodeSessions.push({ base64Image: base64Qrimg, urlCode, sessionId });
                } else {
                    this.qrCodeSessions[qrCodeIndex] = { base64Image: base64Qrimg, urlCode, sessionId };
                }
            },

            statusFind: async (statusSession, session) => {
                console.log('Session name: ', session, '\nStatus Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken

                const sessionIndex = this.sessions.findIndex((s) => s.id === sessionId);

                //this.rabbitMQService.emitEvent(process.env.RABBIT_QUEUE, 'whatsapp_change_status_channel', { session, statusSession })

                if (StatusFind.desconnectedMobile === statusSession) {
                    if (this.sessions[sessionIndex].wid) {
                        const dataSendToRabbit = {
                            id: sessionId,
                            wid: this.sessions[sessionIndex].wid
                        }

                        this.rabbitMQService.emitEvent(process.env.RABBIT_QUEUE, 'whatsapp_disconected_mobile', { session: dataSendToRabbit })
                    }
                    this.deleteSession(sessionId)
                }

                if (['autocloseCalled', 'browserClose', 'serverClose'].includes(statusSession)) {
                    // if (['autocloseCalled', 'notLogged', 'browserClose', 'serverClose', 'qrReadError', 'desconnectedMobile'].includes(statusSession)) {
                    const qrCodeIndex = this.qrCodeSessions.findIndex((qrc) => qrc.sessionId === sessionId);
                    if (qrCodeIndex !== -1) {
                        this.qrCodeSessions.splice(qrCodeIndex, 1);
                    }
                    this.deleteSession(sessionId)
                }

                if ([StatusFind.inChat, StatusFind.isLogged].includes(statusSession as StatusFind)) {
                    const qrCodeIndex = this.qrCodeSessions.findIndex((qrc) => qrc.sessionId === sessionId);
                    if (qrCodeIndex !== -1) {
                        this.qrCodeSessions.splice(qrCodeIndex, 1);
                    }
                }

                if (statusSession === 'inChat') {

                    // await new Promise(async (resolve, _reject) => {

                    const interval = setInterval(async () => {
                        console.log('NUEVO INTENTO PARA OBTENER EL WID')
                        if (!this.sessions[sessionIndex].whatsapp) return

                        const wid = (await this.sessions[sessionIndex].whatsapp.getWid()).split('@')[0]
                        this.sessions[sessionIndex].wid = wid;


                        if (this.sessions.filter(s => s.wid === wid).length > 1) {
                            console.log('SESIONS DUPLICADA ');
                            console.log('CERRANDO SESSION ....');
                            const { success } = await this.logout(this.sessions[sessionIndex])

                            if (success) {
                                console.log('SESION CERRADA EXITOSAMENTE');
                            }

                            clearInterval(interval);
                            this.sessions[sessionIndex].state = 'duplicated'
                            return
                        }

                        console.log('WID OBTENIDO', wid)

                        this.updateWebhook(sessionId, `${process.env.HOST_WEBHOOK}/webhook/${sessionId}`)
                        clearInterval(interval);
                        this.sessions[sessionIndex].state = 'inChat'


                    }, 1000);

                }


            },
            puppeteerOptions: {}, // is nessessary for mutiple sessions
            browserArgs: [
                "--disable-web-security",
                "--no-sandbox",
                "--disable-web-security",
                "--aggressive-cache-discard",
                "--disable-cache",
                "--disable-application-cache",
                "--disable-offline-load-stale-cache",
                "--disk-cache-size=0",
                "--disable-background-networking",
                "--disable-default-apps",
                "--disable-extensions",
                "--disable-sync",
                "--disable-translate",
                "--hide-scrollbars",
                "--metrics-recording-only",
                "--mute-audio",
                "--no-first-run",
                "--safebrowsing-disable-auto-update",
                "--ignore-certificate-errors",
                "--ignore-ssl-errors",
                "--ignore-certificate-errors-spki-list"
            ],
            autoClose: 300000,
            logQR: true,
            disableWelcome: true, // Option to disable the welcoming message which appears in the beginning
            tokenStore: 'file', // Define how work with tokens, that can be a custom interface
            folderNameToken: './tokens', //folder name when saving tokens
        });

        const sessionIndex = this.sessions.findIndex((s) => s.id === sessionId);
        this.sessions[sessionIndex].whatsapp = whatsapp;

        return { data: { id: sessionId }, success: true, message: 'Cliente creado exitosamente' };
    }

    registerOnMessageCallback(sessionId: string) {
        const whatsappSession: WhatsappSession = this.findById(sessionId)
        const { wid, whatsapp, webhook } = whatsappSession;
        if (this.onMessageEvents[sessionId]) {
            this.onMessageEvents[sessionId].dispose()
        }

        this.onMessageEvents[sessionId] = whatsapp.onMessage(async (message: Message) => {
            console.log('CALLBACK DE ' + wid);
            if (message.isGroupMsg) {
                console.log('Mensaje de grupo', message.body);
                return;
            }

            if (message.from === 'status@broadcast') {
                console.log('STATUS IGNORED', message.sender);
                return;
            }

            if (message.type === MessageType.STICKER) {
                console.log('STIKER');
                return;
            }

            if (message.type === MessageType.E2E_NOTIFICATION) {
                console.log(message.type);
                return;
            }

            if (message.self === 'in' && wid === message.to.split('@')[0]) {
                console.log('MENSAJE RECIBIDO');

                const clientNumber = message.from.split('@')[0];

                if (!this.testNumbers.includes(wid)) {
                    try {
                        await this.axios.post(webhook, { sid: message.id.split('_')[2], ...message });

                    } catch (error) {
                        console.log('******************************************************ERROR EN EL WEBHOOK POST *************************************\n ', error);
                    }
                    return;
                }

                if (this.availableNumbers.includes(clientNumber)) {
                    try {
                        await this.axios.post(webhook, { sid: message.id.split('_')[2], ...message });

                    } catch (error) {
                        console.log('******************************************************ERROR EN EL WEBHOOK POST *************************************\n ', error);
                    }
                    return;
                }

                if (message.body === 'join wpp-onbotgo') {
                    this.availableNumbers.push(clientNumber);
                    this.updateAvailableNumbers();
                    whatsapp.sendText(clientNumber, 'Te has unido a wpp-onbotgo');
                }
            }
        });
    }

    registerOnAckCallback(sessionId: string) {
        const whatsappSession: WhatsappSession = this.findById(sessionId)
        const { wid, whatsapp, webhook } = whatsappSession;

        if (this.onAckEvents[sessionId]) {
            this.onAckEvents[sessionId].dispose()
        }

        this.onAckEvents[sessionId] = whatsapp.onAck(async (ack: Ack) => {
            if (ack.self === 'out' && wid === ack.from.split('@')[0]) {
                console.log('ACK ' + wid, ack);
                try {
                    await this.axios.put(webhook, { sid: ack.id.id, ...ack });
                } catch (error) {
                    console.log('******************************************************ERROR EN EL WEBHOOK PUT *************************************\n ', error);
                }
            }
        });
    }

    updateClientsFileRepo() {
        const clientsToSave = this.sessions.map(({ id, wid, webhook }) => ({ id, wid, webhook }));
        fs.writeFileSync('whatsapp-clients.json', JSON.stringify(clientsToSave));
    }

    async logout(data: WhatsappSession): Promise<{ data: any; message: string; success: boolean }> {
        let session: WhatsappSession;

        if (data.wid) session = this.findByWid(data.wid);
        if (data.id) session = this.findById(data.id);


        if (!session) {
            return { data: null, message: 'La session no existe o aun no se ha iniciado', success: false };
        }

        if (!session.whatsapp) {
            return { data: null, message: 'La session no existe o aun no se ha iniciado', success: false };
        }

        const itLogout = await session.whatsapp.logout();
        const sessionIndex = this.sessions.findIndex((s) => s.id === session.id);
        this.sessions[sessionIndex].wid = null;

        return { data: itLogout, message: 'Session cerrada exitosamente', success: true };
    }


    async deleteSession(sessionId: string) {
        const sessionIndex = this.sessions.findIndex((s) => s.id === sessionId);
        if (sessionIndex === -1) return true
        if (this.sessions[sessionIndex].whatsapp) {
            await this.sessions[sessionIndex].whatsapp.close();

            await this.sessions[sessionIndex].whatsapp.tokenStore.removeToken(sessionId)
        }
        if (fs.existsSync(`tokens/${sessionId}`)) {
            fs.rmSync(`tokens/${sessionId}`, { recursive: true, force: true })
        }
        this.sessions.splice(sessionIndex, 1)
        this.updateClientsFileRepo()
        return true

    }

    async getQrCode(sessionId: string | undefined): Promise<{ data: any; message: string; success: boolean }> {
        let qrCode = this.qrCodeSessions.find(qr => qr.sessionId === sessionId)

        if (qrCode) return { data: qrCode, message: 'QR', success: true };
        const uid = this.uid()

        if (!sessionId) {
            setTimeout(async () => {
                const session = this.findById(sessionId)
                if (session && ![undefined, 'undefined', null, ''].includes(session.wid)) return
                const qrIndex = this.qrCodeSessions.findIndex(qr => qr.sessionId === uid)
                this.qrCodeSessions.splice(qrIndex, 1)
                await this.deleteSession(uid)
            }, 600000)
        }
        sessionId = sessionId ?? uid

        this.createClient(sessionId);

        await new Promise((resolve) => {
            const interval = setInterval(() => {
                qrCode = this.qrCodeSessions.find(qr => qr.sessionId === sessionId)
                if (qrCode) {
                    clearInterval(interval);
                    resolve(true);
                }
            }, 2000);
        });

        return { data: qrCode, message: 'QR', success: true };
    }

    async closeClient(data: WhatsappSession): Promise<{ data: any; message: string; success: boolean }> {
        let session: WhatsappSession;

        if (data.wid) session = this.findByWid(data.wid);
        if (data.id) session = this.findById(data.id);

        if (!session) {
            return { data: null, message: 'La session no existe o aun no se ha iniciado', success: false };
        }
        if (session.state === 'browserClose') {
            return { data: null, message: 'Esta session ya esta apagada', success: false };
        }

        const itClosed = await session.whatsapp.close();
        return { data: itClosed, message: 'Session cerrada exitosamente', success: true };
    }

    async startClient(data: WhatsappSession): Promise<{ data: any; message: string; success: boolean }> {
        let session: WhatsappSession;

        if (data.wid) session = this.findByWid(data.wid);
        if (data.id) session = this.findById(data.id);

        if (!session) {
            return { data: null, message: 'El sessione no existe o aun no se ha iniciado', success: false };
        }

        if (session.state === 'inChat') {
            return { data: null, message: 'Esta session ya esta iniciada', success: false };
        }

        if (data.webhook) session.webhook = data.webhook;

        return await this.createClient(session.id);
    }

    findByWid(wid: string) {
        //wid es el numero de whatsapp
        return this.sessions.find((s) => s.wid === wid);
    }

    async onModuleDestroy() {
        for (const session of this.sessions) {
            await session.whatsapp.close();
        }
    }
}
