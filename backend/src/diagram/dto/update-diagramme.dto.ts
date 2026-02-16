import { TypeDiagramme } from '@prisma/client';

export class UpdateDiagrammeDto {
    titre?: string;
    type?: TypeDiagramme;
    contenu?: string;
}
