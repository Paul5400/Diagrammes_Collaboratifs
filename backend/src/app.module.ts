import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DiagramModule } from './diagram/diagram.module';
import { CollabModule } from './collab/collab.module';
import { GitModule } from './git/git.module';

@Module({
  imports: [AuthModule, UserModule, DiagramModule, CollabModule, GitModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
