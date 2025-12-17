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
        // Point d'entrée : Cette route redirige l'utilisateur vers la page de connexion GitHub.
        // Le Guard 'github' gère automatiquement la construction de l'URL avec le Client ID.
    }

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    async githubLoginCallback(@Req() req, @Res() res) {
        // Callback : GitHub redirige l'utilisateur ici après qu'il ait accepté.
        // Le Guard vérifie le code renvoyé par GitHub, récupère le profil, et peuple 'req.user'.

        // Génération du JWT pour notre application
        const jwt = await this.authService.login(req.user);

        // Redirection vers le Frontend avec le Token
        // TODO: Sécuriser ce passage (Cookie HttpOnly serait mieux pour la prod),
        // mais pour l'instant on le passe en Query Param pour simplifier le développement Frontend.
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?token=${jwt.access_token}`);
    }
}
