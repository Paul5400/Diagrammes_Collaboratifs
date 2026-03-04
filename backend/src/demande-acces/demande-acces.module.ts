import { Module } from '@nestjs/common';
import { DemandeAccesService } from './demande-acces.service';
import { DemandeAccesController } from './demande-acces.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { GitModule } from '../git/git.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    GitModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-secret',
      }),
    }),
  ],
  controllers: [DemandeAccesController],
  providers: [DemandeAccesService],
  exports: [DemandeAccesService],
})
export class DemandeAccesModule {}

