import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    @Get('github')
    @UseGuards(AuthGuard('github'))
    async githubLogin() {
        // Initiates the GitHub OAuth flow
    }

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    async githubLoginCallback(@Req() req, @Res() res) {
        // Handles the callback from GitHub
        const jwt = await this.authService.login(req.user);

        // Redirect to Frontend with Token
        // TODO: Secure this better (Cookie vs Query Param)
        // For MVP Week 2: Query Param is simplest.
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?token=${jwt.access_token}`);
    }
}
