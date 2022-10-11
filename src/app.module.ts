import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChannelMap } from './channel-map/channel-map.entity';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { RabbitMQModule } from './rabbit-mq/rabbit-mq.module';
import { SessionModule } from './session/session.module';
import { TypeOrmModule } from '@nestjs/typeorm'
import { RequestMiddleware } from './middlewares/request.middleware';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            useUTC: false,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            entities: [
                ChannelMap
            ],
            autoLoadEntities: false,
            logging: process.env.TYPEORM_LOGS === 'true'
        }),
        SessionModule,
        MessageModule,
        ChatModule,
        RabbitMQModule
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestMiddleware).forRoutes('*')
    }
}
