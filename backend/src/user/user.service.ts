import { Injectable } from '@nestjs/common';

export interface User {
    id: string;
    githubId: string;
    username: string;
    email: string;
    avatarUrl: string;
    accessToken: string;
}

@Injectable()
export class UserService {
    // TODO: Replace with Real DB (Postgres/Prisma)
    private users: User[] = [];

    async findOrCreate(profile: any): Promise<User> {
        const existingUser = this.users.find(u => u.githubId === profile.githubId);
        if (existingUser) {
            // Update token
            existingUser.accessToken = profile.accessToken;
            return existingUser;
        }

        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9), // Mock ID
            githubId: profile.githubId,
            username: profile.username,
            email: profile.email,
            avatarUrl: profile.picture,
            accessToken: profile.accessToken,
        };
        this.users.push(newUser);
        return newUser;
    }

    async findOne(id: string): Promise<User | undefined> {
        return this.users.find(u => u.id === id);
    }
}
