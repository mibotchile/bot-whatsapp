import { Module} from '@nestjs/common'
import { GCPStorageService } from 'src/gcp-storage/gcp-storage.service'
import { MessageController } from './message.controller'
import { MessageService } from './message.service'

@Module({
  providers: [MessageService,GCPStorageService],
  controllers:[MessageController]
})
export class MessageModule {}
