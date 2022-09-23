import { Injectable, OnModuleInit } from '@nestjs/common'
import { Channel, connect, Connection } from 'amqplib'

@Injectable()
export class RabbitMQService implements OnModuleInit {
    channel: Channel
    connection: Connection

    async onModuleInit() {
        console.log('SE INICIO EL RABBIT SERVICE')
        this.connection = await connect(process.env.RABBIT_URL, 'heartbeat=60')
        this.channel = await this.connection.createChannel()
        //const exchange = process.env.RABBIT_BI_EiXCHANGE
        //await this.channel.assertExchange(exchange, 'direct', { durable: true }).catch(console.error)
    }

    emitEvent(queue: string, pattern: string, data: any) {
        //{"pattern":"whatsapp_test_event","data":{"name":"hsjjk","jjj":"a5456"}}
        const content = JSON.stringify({ pattern, data })
        console.log('CONTENT',content);


        return this.channel.sendToQueue(queue, Buffer.from(content))
    }
}
