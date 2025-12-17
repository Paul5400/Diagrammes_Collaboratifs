import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { UserService } from '../user/user.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(
        configService: ConfigService,
        private userService: UserService,
    ) {
        super({
            clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
            clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
            callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || '',
            scope: ['public_repo', 'user:email'], // Important pour cloner les repos
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile) {
        // Étape 1 : Récupération du profil GitHub envoyé par la stratégie Passport
        // 'profile' contient les infos publiques de l'utilisateur (ID, Pseudo, Email, Avatar)
        const { id, username, photos, emails } = profile;

        // Étape 2 : Communication avec le UserService
        // Nous cherchons si cet utilisateur existe déjà dans notre base de données.
        // Si oui, on le récupère et on met à jour son Access Token.
        // Si non, on le crée.
        const user = await this.userService.findOrCreate({
            githubId: id,
            username: username,
            picture: photos && photos.length > 0 ? photos[0].value : null,
            email: emails && emails.length > 0 ? emails[0].value : null,
            accessToken, // IMPORTANT : On stocke le Token GitHub pour pouvoir cloner ses dépôts plus tard (via isomorphic-git)
        });

        // Ce 'user' sera injecté dans l'objet 'req.user' des contrôleurs
        return user;
    }
}
