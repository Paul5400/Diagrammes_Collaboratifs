import { TypeDiagramme } from '@prisma/client';

export class CreateDiagrammeDto {
    titre: string;
    type: TypeDiagramme;
    contenu?: string;
}
