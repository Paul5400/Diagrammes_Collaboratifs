import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GithubStrategy } from './github.strategy';
import { UserModule } from '../user/user.module';

@Module({
	imports: [
		ConfigModule,
		PassportModule.register({ session: false }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET') || 'dev-secret',
				signOptions: { expiresIn: '7d' },
			}),
		}),
		UserModule,
	],
	providers: [AuthService, JwtStrategy, GithubStrategy],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
