import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GithubUser } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: GithubUser) {
    const payload = {
      username: user.username,
      sub: user.githubId ?? user.id,
      picture: user.picture ?? null,
      accessToken: user.accessToken ?? null,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
