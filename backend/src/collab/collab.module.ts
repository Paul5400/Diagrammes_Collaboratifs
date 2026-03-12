import { Module } from '@nestjs/common';
import { CollabService } from './collab.service';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [RedisModule, PrismaModule, UserModule],
    providers: [CollabService],
    exports: [CollabService],
})
export class CollabModule { }
