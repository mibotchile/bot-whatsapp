import { Whatsapp } from "@wppconnect-team/wppconnect";

export interface ObgSession {
    projectUid: string,
    clientUid: string,
}

export interface WhatsappSession {
    id?: string;
    wid?: string;
    whatsapp?: Whatsapp;
    webhook?: string;
    state?: string;
}