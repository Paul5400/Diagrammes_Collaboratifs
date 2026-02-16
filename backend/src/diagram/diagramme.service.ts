import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { Diagramme } from '@prisma/client';
import { CreateDiagrammeDto } from './dto/create-diagramme.dto';
import { UpdateDiagrammeDto } from './dto/update-diagramme.dto';

@Injectable()
export class DiagrammeService {
    private readonly logger = new Logger(DiagrammeService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UserService,
    ) { }

    /**
     * Vérifier que l'utilisateur a accès au projet
     */
    private async verifyProjetAccess(projetId: string, githubId: string) {
        const githubUser = await this.userService.findByGithubId(githubId);
        if (!githubUser) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        const projet = await this.prisma.projet.findUnique({
            where: { id: projetId },
        });

        if (!projet) {
            throw new NotFoundException('Projet introuvable');
        }

        if (projet.idProprietaire !== githubUser.id) {
            throw new ForbiddenException("Vous n'avez pas accès à ce projet");
        }

        return { githubUser, projet };
    }

    /**
     * Créer un diagramme dans un projet
     */
    async create(
        projetId: string,
        githubId: string,
        dto: CreateDiagrammeDto,
    ): Promise<Diagramme> {
        if (!dto.titre || dto.titre.trim().length === 0) {
            throw new BadRequestException('Le titre est obligatoire');
        }

        const { githubUser } = await this.verifyProjetAccess(projetId, githubId);

        const diagramme = await this.prisma.diagramme.create({
            data: {
                titre: dto.titre.trim(),
                type: dto.type,
                contenu: dto.contenu || null,
                idProprietaire: githubUser.id,
                idProjet: projetId,
            },
        });

        this.logger.log(`Diagramme créé: ${diagramme.titre} dans projet ${projetId}`);
        return diagramme;
    }

    /**
     * Récupérer tous les diagrammes d'un projet
     */
    async findAllByProjet(projetId: string, githubId: string): Promise<Diagramme[]> {
        await this.verifyProjetAccess(projetId, githubId);

        return this.prisma.diagramme.findMany({
            where: { idProjet: projetId },
            orderBy: { dateModification: 'desc' },
        });
    }

    /**
     * Récupérer un diagramme spécifique
     */
    async findOne(diagrammeId: string, githubId: string): Promise<Diagramme> {
        const githubUser = await this.userService.findByGithubId(githubId);
        if (!githubUser) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        const diagramme = await this.prisma.diagramme.findUnique({
            where: { id: diagrammeId },
            include: { projet: true },
        });

        if (!diagramme) {
            throw new NotFoundException('Diagramme introuvable');
        }

        // Vérifier l'accès via le projet
        if (diagramme.projet?.idProprietaire !== githubUser.id) {
            throw new ForbiddenException("Vous n'avez pas accès à ce diagramme");
        }

        return diagramme;
    }

    /**
     * Mettre à jour un diagramme
     */
    async update(
        diagrammeId: string,
        githubId: string,
        dto: UpdateDiagrammeDto,
    ): Promise<Diagramme> {
        const githubUser = await this.userService.findByGithubId(githubId);
        if (!githubUser) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        const diagramme = await this.prisma.diagramme.findUnique({
            where: { id: diagrammeId },
            include: { projet: true },
        });

        if (!diagramme) {
            throw new NotFoundException('Diagramme introuvable');
        }

        if (diagramme.projet?.idProprietaire !== githubUser.id) {
            throw new ForbiddenException("Vous n'avez pas le droit de modifier ce diagramme");
        }

        const updated = await this.prisma.diagramme.update({
            where: { id: diagrammeId },
            data: {
                ...(dto.titre && { titre: dto.titre.trim() }),
                ...(dto.type && { type: dto.type }),
                ...(dto.contenu !== undefined && { contenu: dto.contenu }),
            },
        });

        this.logger.log(`Diagramme mis à jour: ${updated.id}`);
        return updated;
    }

    /**
     * Supprimer un diagramme
     */
    async delete(diagrammeId: string, githubId: string): Promise<void> {
        const githubUser = await this.userService.findByGithubId(githubId);
        if (!githubUser) {
            throw new NotFoundException('Utilisateur introuvable');
        }

        const diagramme = await this.prisma.diagramme.findUnique({
            where: { id: diagrammeId },
            include: { projet: true },
        });

        if (!diagramme) {
            throw new NotFoundException('Diagramme introuvable');
        }

        if (diagramme.projet?.idProprietaire !== githubUser.id) {
            throw new ForbiddenException("Vous n'avez pas le droit de supprimer ce diagramme");
        }

        await this.prisma.diagramme.delete({
            where: { id: diagrammeId },
        });

        this.logger.log(`Diagramme supprimé: ${diagrammeId}`);
    }
}
