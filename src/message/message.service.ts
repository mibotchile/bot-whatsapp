import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { GCPStorageService } from 'src/gcp-storage/gcp-storage.service';
import { SessionService } from 'src/session/session.service';
import { writeFileSync } from 'fs';
import { buildBucketName } from 'src/utils/bucketName';
import { SendFileData } from './message.types';
import { Message } from '@wppconnect-team/wppconnect';
import { buildUploadPath } from 'src/utils/uploadName';

@Injectable()
export class MessageService {

    constructor(
        @Inject(forwardRef(() => SessionService)) private sessionService: SessionService,
        private gcpStorageService: GCPStorageService
    ) { }

    async sendText(data: { from: string, to: string, text: string }) {
        const session = this.sessionService.findByWid(data.from)
        if (!session) this.showError('No existe session con este numero')

        const message = await session.whatsapp.sendText(data.to, data.text)
        return { sid: message.id.split('_')[2], mediaUrl: '', ...message }
    }


    async sendFile(data: SendFileData) {
        console.log('DATA SEND FILE', data);

        const session = this.sessionService.findByWid(data.from)
        if (!session) this.showError('No existe session con este numero')
        const { from, file, obgSession, to, caption } = data
        const { name: fileName, buffer } = file
        console.log('FILEEE', file);

        let fileBuffer = Buffer.from(buffer.data)
        const ext = fileName.split('.').pop()
        console.log({ ext });

        const destination = 'filesDownload/' + fileName.replace(`.${ext}`, `_${Date.now()}.${ext}`)
        writeFileSync(destination, fileBuffer)

        let message: Message

        if (['jpg', 'png', 'jpeg', 'gif', 'webp', 'tif'].includes(ext)) {
            message = await this.sendImage(from, to, destination, fileName, caption)
            const image = await session.whatsapp.downloadMedia(message)
            fileBuffer = Buffer.from(image, 'base64')
        } else {
            message = await this.sendDocument(from, to, destination, fileName)
        }
        const bucketName = buildBucketName(obgSession.clientUid)
        const uploadName = buildUploadPath(fileName)
        const fileMetadata = await this.gcpStorageService.uploadFile(bucketName, destination, uploadName)
        if (!fileMetadata) this.showError('Error al procesar el archivo')
        console.log('METADATA FILE', fileMetadata.id);
        const mediaUrl = fileMetadata.publicUrl()
        return { sid: message.id.split('_')[2], mediaUrl, mimeType: message.mimetype, ...message }
    }


    private async sendDocument(from: string, to: string, path: string, filename: string) {
        const session = this.sessionService.findByWid(from)
        const sendResult = await session.whatsapp.sendFile(to + '@c.us', path, { filename })
        if (sendResult.sendMsgResult !== 'OK') this.showError('Error al enviar el archivo')
        const message = await session.whatsapp.getMessageById(sendResult.id)
        return message
    }

    private async sendImage(from: string, to: string, destination: string, fileName: string, caption?: string) {
        const session = this.sessionService.findByWid(from)
        const sendResult = await session.whatsapp.sendImage(to + '@c.us', destination, fileName, caption ?? '')
        if (sendResult.sendMsgResult !== 'OK') this.showError('Error al enviar la imagen')
        const message = await session.whatsapp.getMessageById(sendResult.id)
        return message
    }

    showError(message: string) {
        throw new HttpException({ success: false, message }, HttpStatus.NOT_ACCEPTABLE)
    }

    // async sendImage(data: { projectUid: string, from: string, to: string, url: string, caption?: string }) {
    //     const session = this.sessionService.findByWid(data.from)
    //     if (!session) {
    //         throw new HttpException({ success: false, message: 'No existe session con este numero' }, HttpStatus.NOT_ACCEPTABLE)
    //     }

    //     if (!data.url || data.url.trim() === '' || !isValidURL(data.url)) throw new HttpException({ success: false, message: 'La URL de la imagen no es valida' }, HttpStatus.NOT_ACCEPTABLE)

    //     const { metadata, succes } = await this.gcpStorageService.donwloadFromURL(data.url, `filesDownload`)
    //     if (!succes) throw new HttpException({ success: false, message: 'No se pudo descargar la imagen' }, HttpStatus.NOT_ACCEPTABLE)
    //     const sendResult = await session.whatsapp.sendImage(data.to + '@c.us', metadata.destination, metadata.fileName, data.caption ?? '')
    //     if (sendResult.sendMsgResult !== SendMsgResult.OK) throw new HttpException({ success: false, message: 'Error al enviar la imagen' }, HttpStatus.NOT_ACCEPTABLE)
    //     const message = await session.whatsapp.getMessageById(sendResult.id)
    //     return { sid: message.id.split('_')[2], mediaUrl: data.url, ...message }

    // }
}
