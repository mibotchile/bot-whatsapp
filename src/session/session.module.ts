import { Module} from '@nestjs/common'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'


@Module({
  providers: [SessionService],
  controllers:[SessionController]
})
export class PrismaModule {}
