import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDemandeAccesDto {
  @IsNotEmpty()
  @IsUUID()
  projetId: string;
}
