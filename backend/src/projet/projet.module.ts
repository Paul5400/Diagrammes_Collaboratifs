import { Module } from '@nestjs/common';
import { ProjetController } from './projet.controller';
import { ProjetService } from './projet.service';
import { GitModule } from '../git/git.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [GitModule, UserModule],
  controllers: [ProjetController],
  providers: [ProjetService],
  exports: [ProjetService],
})
export class ProjetModule {}
