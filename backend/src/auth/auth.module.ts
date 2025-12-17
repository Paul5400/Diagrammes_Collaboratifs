import { Module } from @nestjs/common;
import { PassportModule } from @nestjs/passport;
import { JwtModule } from @nestjs/jwt;
import { ConfigModule, ConfigService } from @nestjs/config;
import { AuthService } from ./auth.service;
import { AuthController } from ./auth.controller;
import { GithubStrategy } from ./github.strategy;
import { UserModule } from ../user/user.module;

@Module({
  imports: [
    UserModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(JWT_SECRET) || dev-secret,
        signOptions: { expiresIn: 1d },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, GithubStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
