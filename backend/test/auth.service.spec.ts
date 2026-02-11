import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  it('doit générer un token JWT pour un utilisateur GitHub', () => {
    const mockUser = {
      githubId: 123,
      username: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    const result = service.generateToken(mockUser as any);

    expect(result).toHaveProperty('access_token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      username: mockUser.username,
      sub: mockUser.githubId,
      picture: mockUser.avatarUrl,
    });
  });
});