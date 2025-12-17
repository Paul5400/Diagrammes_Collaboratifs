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
        // Ici, nous récupérons les infos de GitHub
        // Nous les renvoyons à AuthService pour créer/trouver l'utilisateur
        const { id, username, photos, emails } = profile;
        const user = await this.userService.findOrCreate({
            githubId: id,
            username: username,
            picture: photos && photos.length > 0 ? photos[0].value : null,
            email: emails && emails.length > 0 ? emails[0].value : null,
            accessToken, // TRES IMPORTANT : On le garde pour isomorphic-git plus tard
        });
        return user;
    }
}
