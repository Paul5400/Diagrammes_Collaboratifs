import { Module } from '@nestjs/common';
import { DemandeAccesService } from './demande-acces.service';
import { DemandeAccesController } from './demande-acces.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { GitModule } from '../git/git.module';

@Module({
  imports: [PrismaModule, UserModule, GitModule],
  controllers: [DemandeAccesController],
  providers: [DemandeAccesService],
  exports: [DemandeAccesService],
})
export class DemandeAccesModule {}

