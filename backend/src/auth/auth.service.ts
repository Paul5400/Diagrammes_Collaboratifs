import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GithubUser } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateToken(githubUser: GithubUser) {
    const payload = {
      username: githubUser.username,
      sub: githubUser.githubId,
      picture: githubUser.avatarUrl,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
