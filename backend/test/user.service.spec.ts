import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../src/user/user.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('UserService', () => {
    let service: UserService;
    let prismaService: PrismaService;
    let redisService: RedisService;

    const mockPrismaService = {
        githubUser: {
            upsert: jest.fn(),
            findUnique: jest.fn(),
        },
    };

    const mockRedisService = {
        storeGithubToken: jest.fn(),
        getGithubToken: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: RedisService,
                    useValue: mockRedisService,
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        prismaService = module.get<PrismaService>(PrismaService);
        redisService = module.get<RedisService>(RedisService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('doit être défini', () => {
        expect(service).toBeDefined();
    });

    describe('findOrCreateFromGithub', () => {
        it('doit créer un nouvel utilisateur GitHub', async () => {
            const mockProfile = {
                githubId: '12345',
                username: 'testuser',
                email: 'test@example.com',
                avatarUrl: 'https://avatar.url',
                accessToken: 'test-token',
            };

            const mockUser = {
                id: 1,
                githubId: mockProfile.githubId,
                username: mockProfile.username,
                email: mockProfile.email,
                avatarUrl: mockProfile.avatarUrl,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.githubUser.upsert.mockResolvedValue(mockUser);
            mockRedisService.storeGithubToken.mockResolvedValue(undefined);

            const result = await service.findOrCreateFromGithub(mockProfile);

            expect(result).toEqual(mockUser);
            expect(mockRedisService.storeGithubToken).toHaveBeenCalledWith(
                mockProfile.githubId,
                mockProfile.accessToken,
            );
            expect(mockPrismaService.githubUser.upsert).toHaveBeenCalledWith({
                where: { githubId: mockProfile.githubId },
                update: {
                    username: mockProfile.username,
                    email: mockProfile.email,
                    avatarUrl: mockProfile.avatarUrl,
                },
                create: {
                    githubId: mockProfile.githubId,
                    username: mockProfile.username,
                    email: mockProfile.email,
                    avatarUrl: mockProfile.avatarUrl,
                },
            });
        });

        it('doit mettre à jour un utilisateur existant', async () => {
            const mockProfile = {
                githubId: '12345',
                username: 'updateduser',
                email: 'updated@example.com',
                avatarUrl: 'https://new-avatar.url',
            };

            const mockUser = {
                id: 1,
                githubId: mockProfile.githubId,
                username: mockProfile.username,
                email: mockProfile.email,
                avatarUrl: mockProfile.avatarUrl,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.githubUser.upsert.mockResolvedValue(mockUser);

            const result = await service.findOrCreateFromGithub(mockProfile);

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.githubUser.upsert).toHaveBeenCalled();
        });
    });

    describe('findByGithubId', () => {
        it('doit trouver un utilisateur par githubId', async () => {
            const mockUser = {
                id: 1,
                githubId: '12345',
                username: 'testuser',
                email: 'test@example.com',
                avatarUrl: 'https://avatar.url',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.githubUser.findUnique.mockResolvedValue(mockUser);

            const result = await service.findByGithubId('12345');

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.githubUser.findUnique).toHaveBeenCalledWith({
                where: { githubId: '12345' },
            });
        });

        it('doit retourner null si utilisateur non trouvé', async () => {
            mockPrismaService.githubUser.findUnique.mockResolvedValue(null);

            const result = await service.findByGithubId('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getGithubAccessToken', () => {
        it('doit récupérer le token depuis Redis', async () => {
            mockRedisService.getGithubToken.mockResolvedValue('test-token');

            const result = await service.getGithubAccessToken('12345');

            expect(result).toBe('test-token');
            expect(mockRedisService.getGithubToken).toHaveBeenCalledWith('12345');
        });

        it('doit retourner null si pas de token', async () => {
            mockRedisService.getGithubToken.mockResolvedValue(null);

            const result = await service.getGithubAccessToken('12345');

            expect(result).toBeNull();
        });
    });
});
