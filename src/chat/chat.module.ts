import { Module} from '@nestjs/common'
import { SessionService } from 'src/session/session.service'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'


@Module({
  providers: [ChatService,SessionService],
  controllers:[ChatController]
})
export class ChatModule {}
