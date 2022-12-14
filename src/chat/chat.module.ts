import { Module} from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'


@Module({
  providers: [ChatService],
  controllers:[ChatController]
})
export class ChatModule {}
