import { Module} from '@nestjs/common'
import { SessionService } from 'src/session/session.service'
import { MessageController } from './message.controller'
import { MessageService } from './message.service'


@Module({
  providers: [MessageService,SessionService],
  controllers:[MessageController]
})
export class MessageModule {}
