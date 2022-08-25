import { Injectable } from '@nestjs/common';
import { Ack, create, Message, MessageType, Whatsapp } from '@wppconnect-team/wppconnect';
import * as fs from 'node:fs';

@Injectable()
export class AppService {
    client: Whatsapp;

    constructor() {
        this.init();
    }

    async init() {
        this.client = await create({
            session: 'test',
            catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
                // console.log('Number of attempts to read the qrcode: ', attempts);
                console.log('Terminal qrcode: ', asciiQR);
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
            // BrowserSessionToken
            // To receive the client's token use the function await clinet.getSessionTokenBrowser()
        });
       

        //const chats: Chat[] = await client.getAllChats();
        //console.log(chats);
        // client.sendText()
        // const messages: Message[] = await this.client.getMessages('51931639441@c.us');
        // console.log('*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*\n', messages);
        // console.log('---------------------------------------------');

        this.client.onAnyMessage(async (message: Message) => {
            if (message.self === 'out') {
                console.log('MENSAJE ENVIADO', message);
            }

            if (message.self === 'in') {
                console.log('MENSAJE RECIBIDO', message);
            }

            if (message.type === MessageType.IMAGE) {
                const b64 = await this.client.downloadMedia(message);
                fs.writeFileSync('imageb64.txt', b64);
                fs.writeFileSync('nose_test.jpg', Buffer.from(b64.split(',')[1], 'base64'));
            }

            if (message.type === MessageType.STICKER) {
                const b64 = await this.client.downloadMedia(message);
                fs.writeFileSync('stiker.txt', b64);
                fs.writeFileSync('stiker.webp', Buffer.from(b64.split(',')[1], 'base64'));
            }
        });

        this.client.onAck((ack: Ack) => {
            console.log('ACK ACK -----\n', ack);
        });

        // const message: Message = await client.getMessageById('true_51923161637@c.us_BDBFC5116BDCC96199C4084EA84FEAF5');
        // fs.writeFileSync('messages_antonio.json', JSON.stringify(messages));

        //console.log(message);
    }

    async seenChat(chatId: string) {
        const info = await this.client.sendSeen(chatId);
        return info;
    }

    async sendTextMessage(to, text) {
        if (!this.client) {
            return 'initiling client';
        }
        return await this.client.sendText(to, text);
    }

    async sendButtonMessage(to, text) {
        if (!this.client) {
            return 'initiling client';
        }
        return await this.client.sendText(to, text, {
            useTemplateButtons: true, // False for legacy
            buttons: [
                {
                    id: 'o 1',
                    text: 'Option1',
                },
                {
                    id: 'o2',
                    text: 'Option 2',
                },
                {
                    id: 'o3',
                    text: 'Option 3',
                },
                {
                    id: 'o4',
                    text: 'Option 4',
                },
            ],
            title: 'Title text', // Optional
            footer: 'Footer text', // Optional
        });
    }

    async findAllSessions(){
        this.client.tokenStore.listTokens()
    }
}
