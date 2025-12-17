import { Controller, Get, Req, UseGuards, Res, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) { }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Redirection automatique vers GitHub gérée par passport-github2
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubLoginCallback(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    console.log('=== CONTROLLER CALLBACK CALLED ===');
    const passportUser = (req as any).user;
    const jwt = await this.authService.login(passportUser);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    console.log('Redirecting to:', `${frontendUrl}/login?token=...`);

    // Force 302 and explicit redirect
    return res.status(302).redirect(`${frontendUrl}/login?token=${jwt.access_token}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: FastifyRequest) {
    const payload = (req as any).user;
    const githubId = payload?.sub;

    if (!githubId) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const user = await this.userService.findByGithubId(githubId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const { accessToken, ...safeUser } = user;
    return safeUser;
  }
}
