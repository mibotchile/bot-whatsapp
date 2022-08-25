import { Injectable, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common'
import { Request } from 'express'
// import * as fs from 'node:fs'
// import { resolve } from 'node:path'
import { Ack, create, Message, MessageType, Whatsapp } from '@wppconnect-team/wppconnect';
import * as fs from 'node:fs';
interface WhatsappClient {
    id?: string,
    client: Whatsapp,
    webhook: string
}

@Injectable()
export class SessionService implements OnModuleDestroy {
    // the client instances cache object
    private clients: { [key: string]: WhatsappClient } = {}

    uid(): string {
        return (Date.now() + Math.random() * 10000).toString(36).replace('.', '');
    }

    async createClient(data: WhatsappClient):Promise<{data:any,message:string,success:boolean}> {

        if(Object.values(this.clients).length===5){
            return {data:[],success:false,message:'No se puede crear mas de 5 sessiones'}
        }
        const session = data.id ?? this.uid()
        let qrCodeBase64:string
        const client = await create({
            session,//test
            catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
                // console.log('Number of attempts to read the qrcode: ', attempts);
                console.log('Terminal qrcode: ', asciiQR);
                qrCodeBase64=base64Qrimg
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
            disableWelcome: false, // Option to disable the welcoming message which appears in the beginning
            updatesLog: true, // Logs info updates automatically in terminal
            autoClose: 60000, // Automatically closes the wppconnect only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
            tokenStore: 'file', // Define how work with tokens, that can be a custom interface
            folderNameToken: './tokens', //folder name when saving tokens
        });
        console.log('kjaskdklasdkjlkjlasdkljaslkjdkjl');



        //const chats: Chat[] = await client.getAllChats();
        //console.log(chats);
        // client.sendText()
        // const messages: Message[] = await this.client.getMessages('51931639441@c.us');
        // console.log('*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*\n', messages);
        // console.log('---------------------------------------------');
        const wid = await client.getWid()
        console.log('WID---', wid);


        client.onAnyMessage(async (message: Message) => {

            if (message.from === 'status@broadcast') {
                console.log('NEW STATUS', message.sender);
            }

            if (message.self === 'out') {
                console.log('MENSAJE ENVIADO', message);
            }

            if (message.self === 'in') {
                console.log('MENSAJE RECIBIDO', message);
                
            }

            if (message.type === MessageType.IMAGE) {
                const b64 = await client.downloadMedia(message);
                fs.writeFileSync('imageb64.txt', b64);
                fs.writeFileSync('nose_test.jpg', Buffer.from(b64.split(',')[1], 'base64'));
            }

            if (message.type === MessageType.STICKER) {
                const b64 = await client.downloadMedia(message);
                fs.writeFileSync('stiker.txt', b64);
                fs.writeFileSync('stiker.webp', Buffer.from(b64.split(',')[1], 'base64'));
            }
        });

        client.onAck((ack: Ack) => {
            console.log('ACK ACK -----\n', ack);
        });

        this.clients[session] = { id: session, client, webhook: data.webhook }
        return {data:{id:session,qrCodeBase64},success:true,message:'session creada exitosamente'}
    }

    async onModuleDestroy() {
        for (const client of Object.values(this.clients)) {
            await client.client.close()
        }
    }
}
