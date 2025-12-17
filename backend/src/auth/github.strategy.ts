import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { UserService, GithubProfilePayload } from '../user/user.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
	private readonly logger = new Logger(GithubStrategy.name);
	private readonly usedCodes = new Set<string>();

	constructor(
		private readonly configService: ConfigService,
		private readonly userService: UserService,
	) {
		super({
			clientID: configService.get<string>('GITHUB_CLIENT_ID'),
			clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
			callbackURL:
				configService.get<string>('GITHUB_CALLBACK_URL') ||
				`http://localhost:${configService.get<string>('BACKEND_PORT') || '3001'}/auth/github/callback`,
			scope: ['user:email'],
		});
	}

 authenticate(req: any, options?: any) {
   const code = req?.query?.code;
   if (code) {
      this.logger.debug(`Received GitHub code ${code}`);
      if (this.usedCodes.has(code)) {
        this.logger.warn(`GitHub code ${code} already used. Ignoring duplicate callback.`);
        const res = (req as any).res;
        if (res) {
          res.status(204).send();
        }
        return;
      }
      this.usedCodes.add(code);
      setTimeout(() => this.usedCodes.delete(code), 60_000);
    }
		return super.authenticate(req, options);
	}

	async validate(accessToken: string, _refreshToken: string, profile: any) {
		const githubId = profile.id?.toString();
		const username = profile.username ?? profile.displayName ?? null;
		const email = profile.emails?.[0]?.value ?? null;
		const picture = profile.photos?.[0]?.value ?? null;

		const payload: GithubProfilePayload = {
			githubId,
			username,
			email,
			picture,
			accessToken,
		};

		const user = await this.userService.findOrCreateFromGithub(payload);
		return user;
	}
}
