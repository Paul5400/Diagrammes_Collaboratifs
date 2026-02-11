import { Injectable, Logger } from '@nestjs/common';
import { GithubUser } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/loginDto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findOrCreateFromGithub(profile: LoginDto): Promise<GithubUser> {
    try {
      if (profile.accessToken) {
        await this.redis.storeGithubToken(
          profile.githubId,
          profile.accessToken,
        );
      }

      const githubUser = await this.prisma.githubUser.upsert({
        where: { githubId: profile.githubId },
        update: {
          username: profile.username,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
        },
        create: {
          githubId: profile.githubId,
          username: profile.username,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
        },
      });

      this.logger.log(`GitHub user ${profile.githubId} processed`);
      return githubUser;
    } catch (error) {
      this.logger.error(`Failed to process GitHub user: ${error.message}`);
      throw error;
    }
  }

  async findByGithubId(githubId: string): Promise<GithubUser | null> {
    return this.prisma.githubUser.findUnique({ where: { githubId } });
  }

  async getGithubAccessToken(githubId: string): Promise<string | null> {
    return this.redis.getGithubToken(githubId);
  }
}
