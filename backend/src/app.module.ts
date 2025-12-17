import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DiagramModule } from './diagram/diagram.module';
import { CollabModule } from './collab/collab.module';
import { GitModule } from './git/git.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    DiagramModule,
    CollabModule,
    GitModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
