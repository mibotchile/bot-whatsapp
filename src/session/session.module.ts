import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChannelMap } from 'src/channel-map/channel-map.entity'
import { GCPStorageService } from 'src/gcp-storage/gcp-storage.service'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([ChannelMap])],
    providers: [SessionService, GCPStorageService],
    controllers: [SessionController],
    exports: [SessionService]
})
export class SessionModule { }
