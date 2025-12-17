import { Injectable } from @nestjs/common;
import { randomUUID } from crypto;
import { dirname } from path;
import { mkdir, readFile, writeFile } from fs/promises;

const DATA_PATH = process.cwd() + /backend/.data;
const USERS_FILE = DATA_PATH + /users.json;

@Injectable()
export class UserService {
  private async ensureFile() {
    try {
      await mkdir(DATA_PATH, { recursive: true });
      await readFile(USERS_FILE, { encoding: utf8 });
    } catch (e) {
      await writeFile(USERS_FILE, [], { encoding: utf8 });
    }
  }

  private async readUsers() {
    await this.ensureFile();
    const raw = await readFile(USERS_FILE, { encoding: utf8 });
    try {
      return JSON.parse(raw || []);
    } catch (e) {
      return [];
    }
  }

  private async writeUsers(users: any[]) {
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), { encoding: utf8 });
  }

  async findOrCreate(payload: { githubId?: string; username?: string; picture?: string | null; email?: string | null; accessToken?: string; }) {
    const users = await this.readUsers();
    const existing = users.find(u => (payload.githubId && u.githubId === payload.githubId) || (payload.email && u.email === payload.email));
    if (existing) {
      // update token and profile
      existing.username = payload.username ?? existing.username;
      existing.picture = payload.picture ?? existing.picture;
      existing.accessToken = payload.accessToken ?? existing.accessToken;
      await this.writeUsers(users);
      return existing;
    }

    const user = {
      id: randomUUID(),
      githubId: payload.githubId ?? null,
      username: payload.username ?? null,
      picture: payload.picture ?? null,
      email: payload.email ?? null,
      accessToken: payload.accessToken ?? null,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    await this.writeUsers(users);
    return user;
  }
}
