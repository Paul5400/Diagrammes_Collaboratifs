import { IsString, IsEmail, IsOptional } from 'class-validator';
export class LoginDto {
  @IsString()
  githubId: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;
}
