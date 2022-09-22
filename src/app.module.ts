import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { RabbitMQModule } from './rabbit-mq/rabbit-mq.module';
import { SessionModule } from './session/session.module';


@Module({
    imports: [
        ConfigModule.forRoot(),
        SessionModule,
        MessageModule,
        ChatModule,
        RabbitMQModule
    ],
})
export class AppModule { }
