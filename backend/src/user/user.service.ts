import { Injectable } from '@nestjs/common';
import { Prisma, GithubUser } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface GithubProfilePayload {
  githubId: string;
  username?: string | null;
  email?: string | null;
  picture?: string | null;
  accessToken?: string | null;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateFromGithub(profile: GithubProfilePayload): Promise<GithubUser> {
    const data: Prisma.GithubUserCreateInput = {
      githubId: profile.githubId,
      username: profile.username ?? undefined,
      email: profile.email ?? undefined,
      avatarUrl: profile.picture ?? undefined,
      accessToken: profile.accessToken ?? undefined,
    };

    return this.prisma.githubUser.upsert({
      where: { githubId: profile.githubId },
      update: {
        username: profile.username ?? undefined,
        email: profile.email ?? undefined,
        avatarUrl: profile.picture ?? undefined,
        accessToken: profile.accessToken ?? undefined,
      },
      create: data,
    });
  }

  async findByGithubId(githubId: string): Promise<GithubUser | null> {
    return this.prisma.githubUser.findUnique({ where: { githubId } });
  }
}
