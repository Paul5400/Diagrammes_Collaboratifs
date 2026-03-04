import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DiagramModule } from './diagram/diagram.module';
import { CollabModule } from './collab/collab.module';
import { GitModule } from './git/git.module';
import { RedisModule } from './redis/redis.module';
import { ProjetModule } from './projet/projet.module';
import { DemandeAccesModule } from './demande-acces/demande-acces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RedisModule,
    UserModule,
    DiagramModule,
    CollabModule,
    GitModule,
    ProjetModule,
    DemandeAccesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
