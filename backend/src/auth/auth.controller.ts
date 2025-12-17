import { Controller, Get, Req, UseGuards, Res } from @nestjs/common;
import { AuthGuard } from @nestjs/passport;
import { AuthService } from ./auth.service;
import { ConfigService } from @nestjs/config;

@Controller(auth)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get(github)
  @UseGuards(AuthGuard(github))
  async githubLogin() {
    // Redirection automatique vers GitHub gérée par passport-github2
  }

  @Get(github/callback)
  @UseGuards(AuthGuard(github))
  async githubLoginCallback(@Req() req, @Res() res) {
    const jwt = await this.authService.login(req.user);
    const frontendUrl = this.configService.get<string>(FRONTEND_URL) || http://localhost:3000;
    res.redirect();
  }
}
