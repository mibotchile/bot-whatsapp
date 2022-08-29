import {Injectable, OnModuleDestroy } from '@nestjs/common'
import { Ack, create, Message, MessageType, Whatsapp } from '@wppconnect-team/wppconnect';
import * as fs from 'node:fs';
import axios, { Axios } from 'axios';
import * as https from 'node:https'

interface WhatsappClient {
    id?: string,
    wid: string,
    client?: Whatsapp,
    webhook: string
}

@Injectable()
export class SessionService implements OnModuleDestroy {

    private axios: Axios;
    private clients: { [key: string]: WhatsappClient } = {}
    private availableNumbers: string[] = ['51938432015']

    constructor() {
        if (fs.existsSync('whatsapp-clients.json')) {
            const clients = fs.readFileSync('whatsapp-clients.json', 'utf-8')
            this.init(JSON.parse(clients))
        }

        if (!fs.existsSync('available_numbers.json')) {
            this.updateAvailableNumbers()
        }


        this.axios = axios.create({
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });
    }

    private async init(clients: WhatsappClient[]) {
        for (const client of clients) {
            await this.createClient(client, false)
        }
    }

    uid(): string {
        return (Date.now() + Math.random() * 10000).toString(36).replace('.', '');
    }

    updateAvailableNumbers() {
        fs.writeFileSync('available_numbers.json', JSON.stringify(this.availableNumbers))
    }

    async createClient(data: WhatsappClient, addToFile = true): Promise<{ data: any, message: string, success: boolean }> {

        if (Object.values(this.clients).length === 5) {
            return { data: [], success: false, message: 'No se puede crear mas de 5 sessiones' }
        }
        const session = data.id ?? this.uid()
        let qrCodeBase64: string
        const client = await create({
            session,//test
            catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
                // console.log('Number of attempts to read the qrcode: ', attempts);
                console.log('Terminal qrcode: ', asciiQR);
                qrCodeBase64 = base64Qrimg
                // console.log('base64 image string qrcode: ', base64Qrimg);
                // console.log('urlCode (data-ref): ', urlCode);
            },
            statusFind: (statusSession, session) => {
                console.log('Status Session: ', statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
                //Create session wss return "serverClose" case server for close
                console.log('Session name: ', session);
            },
            headless: true, // Headless chrome
            devtools: false, // Open devtools by default
            useChrome: true, // If false will use Chromium instance
            debug: false, // Opens a debug session
            logQR: true, // Logs QR automatically in terminal
            browserWS: '', // If u want to use browserWSEndpoint
            browserArgs: [''], // Parameters to be added into the chrome browser instance
            puppeteerOptions: {}, // Will be passed to puppeteer.launch
            disableWelcome: true, // Option to disable the welcoming message which appears in the beginning
            updatesLog: true, // Logs info updates automatically in terminal
            autoClose: 60000, // Automatically closes the wppconnect only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
            tokenStore: 'file', // Define how work with tokens, that can be a custom interface
            folderNameToken: './tokens', //folder name when saving tokens
        });


        const [wid] = (await client.getWid()).split('@')

        console.log('WID---', wid);


        client.onAnyMessage(async (message: Message) => {
            console.log('CALLBACK DE ' + wid, 'SESSION NAME ' + session);
            if (message.isGroupMsg) {
                console.log('Mensaje de grupo', message.body);
                return
            }

            if (message.from === 'status@broadcast') {
                console.log('STATUS IGNORED', message.sender);
                return
            }

            if (message.self === 'out') {
                console.log('MENSAJE ENVIADO =>', message.body);
            }

            if (message.type === MessageType.STICKER) {
                console.log('STIKER');
                return
            }

            if (message.type === MessageType.E2E_NOTIFICATION) {
                console.log(message.type);
                return
            }

            if (message.self === 'in' && wid === message.to.split('@')[0]) {
                console.log('MENSAJE RECIBIDO', message);

                const clientNumber = message.from.split('@')[0]

                if (this.availableNumbers.includes(clientNumber)) {
                    await this.axios.post(data.webhook, { sid: message.id.split('_')[2], ...message });
                    return
                }

                if (message.body === 'join wpp-onbotgo') {
                    this.availableNumbers.push(clientNumber)
                    this.updateAvailableNumbers()
                    client.sendText(clientNumber, 'Te has unido a wpp-onbotgo')
                }
            }
        });

        client.onAck((ack: Ack) => {
            if (ack.self === 'out' && wid === ack.from.split('@')[0]) {
                console.log('ACK ' + wid,  ack);
                this.axios.put(data.webhook, { sid: ack.id.id, ...ack });
            }
        });

        //client.tokenStore.removeToken('test')

        this.clients[session] = { id: session, client, webhook: data.webhook, wid }

        if (addToFile) {
            const saveClients = Object.values(this.clients).map(c => ({ id: c.id, wid: c.wid, webhook: c.webhook }))
            fs.writeFileSync('whatsapp-clients.json', JSON.stringify(saveClients))
        }
        return { data: { id: session, qrCodeBase64 }, success: true, message: 'Session creada exitosamente' }
    }

    async closeClient(data: WhatsappClient): Promise<{ data: any, message: string, success: boolean }> {
        let client: WhatsappClient

        if (data.wid) client = this.findClientByWid(data.wid)
        if (data.id) client = this.findClientById(data.id)

        if (!client) {
            return { data: null, message: 'El cliente no existe o aun no se ha iniciado', success: false }
        }

        const itClosed = await client.client.close()
        return { data: itClosed, message: 'Cliente cerrado exitosamente', success: true }

    }

    async openClient(data: WhatsappClient): Promise<{ data: any, message: string, success: boolean }> {
        let client: WhatsappClient

        if (data.wid) client = this.findClientByWid(data.wid)
        if (!data.id) client = this.findClientById(data.id)

        if (!client) {
            return { data: null, message: 'El cliente no existe', success: false }
        }

        if (data.webhook) client.webhook = data.webhook

        return await this.createClient(client, false)

    }

    findClientById(clientId: string) {
        return this.clients[clientId]
    }

    findClientByWid(wid: string) {//wid es el numero de whatsapp
        return Object.values(this.clients).find(c => c.wid === wid)
    }

    async onModuleDestroy() {
        for (const client of Object.values(this.clients)) {
            await client.client.close()
        }
    }
}
