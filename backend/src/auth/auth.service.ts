import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async login(user: any) {
        // Cette méthode est appelée une fois que l'utilisateur a été validé par GitHub.
        // Nous allons générer un JWT (JSON Web Token) qui servira de "Passeport" pour la session.

        // Le 'payload' est le contenu du passeport. On y met l'essentiel pour identifier l'utilisateur.
        const payload = {
            username: user.username,
            sub: user.githubId,          // 'sub' est le standard pour l'ID unique (Subject)
            picture: user.picture,
            accessToken: user.accessToken // On inclut le token GitHub pour l'avoir sous la main si besoin
        };

        // On signe le token avec notre clé secrète (JWT_SECRET du .env)
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
