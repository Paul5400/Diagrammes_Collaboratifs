import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async login(user: any) {
        const payload = {
            username: user.username,
            sub: user.githubId,
            picture: user.picture,
            accessToken: user.accessToken
        };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
