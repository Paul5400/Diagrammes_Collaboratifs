import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { GitService } from '../git/git.service';
import { Diagramme } from '@prisma/client';
import { CreateDiagrammeDto } from './dto/create-diagramme.dto';
import { UpdateDiagrammeDto } from './dto/update-diagramme.dto';

@Injectable()
export class DiagrammeService {
    private readonly logger = new Logger(DiagrammeService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UserService,
        private readonly gitService: GitService,
    ) { }

    /**
     * Vérifier que l'utilisateur a accès au projet
     */
    private async verifyProjetAccess(projetId: string, githubId: string) {
        const githubUser = await this.userService.findByGithubId(githubId);
        if (!githubUser) {
            throw new NotFoundException('Utilisateur introuvable. Votre session a peut-être expiré.');
        }

        const projet = await this.prisma.projet.findUnique({
            where: { id: projetId },
        });

        if (!projet) {
            throw new NotFoundException('Ce projet n\'existe pas ou a été supprimé.');
        }

        if (projet.idProprietaire !== githubUser.id) {
            throw new ForbiddenException('Vous n\'avez pas les droits pour accéder à ce projet.');
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

        const { projet } = await this.verifyProjetAccess(projetId, githubId);

        const diagramme = await this.prisma.diagramme.create({
            data: {
                titre: dto.titre.trim(),
                type: dto.type,
                contenu: dto.contenu || null,
                idProprietaire: projet.idProprietaire,
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
            console.warn(`[DiagrammeService] Forbidden: User ${githubUser.id} tried to delete diagram ${diagrammeId} owned by ${diagramme.projet?.idProprietaire}`);
            throw new ForbiddenException("Vous n'avez pas le droit de supprimer ce diagramme");
        }

        console.log(`[DiagrammeService] Deleting diagram ${diagrammeId} from DB`);
        await this.prisma.diagramme.delete({
            where: { id: diagrammeId },
        });

        this.logger.log(`Diagramme supprimé: ${diagrammeId}`);
    }

    /**
     * Récupérer l'historique des versions d'un diagramme depuis GitHub
     */
    async getHistory(
        diagrammeId: string,
        githubId: string,
    ): Promise<
        Array<{
            sha: string;
            message: string;
            author: string;
            date: string;
            url: string;
        }>
    > {
        const githubUser = await this.userService.findByGithubId(githubId);
        if (!githubUser) {
            throw new NotFoundException('Utilisateur introuvable. Votre session a peut-être expiré.');
        }

        const diagramme = await this.prisma.diagramme.findUnique({
            where: { id: diagrammeId },
            include: { projet: true },
        });

        if (!diagramme) {
            throw new NotFoundException('Ce diagramme n\'existe pas ou a été supprimé.');
        }

        if (diagramme.idProprietaire !== githubUser.id) {
            throw new ForbiddenException('Vous n\'avez pas les droits pour accéder à ce diagramme.');
        }

        if (!diagramme.cheminGit) {
            throw new BadRequestException(
                'Ce diagramme n\'a pas encore été sauvegardé sur GitHub',
            );
        }

        if (!diagramme.projet?.cheminGit) {
            throw new BadRequestException(
                'Ce projet n\'a pas de dépôt GitHub associé',
            );
        }

        const accessToken = await this.userService.getGithubAccessToken(githubId);
        if (!accessToken) {
            throw new BadRequestException(
                'Token GitHub non disponible, reconnectez-vous',
            );
        }

        const [owner, repo] = diagramme.projet.cheminGit.split('/');

        const commits = await this.gitService.getFileHistory(
            accessToken,
            owner,
            repo,
            diagramme.cheminGit,
        );

        return commits.map((commit) => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            url: commit.html_url,
        }));
    }

    /**
     * Récupérer le contenu d'un diagramme à une version spécifique
     */
    async getVersionAtCommit(
        diagrammeId: string,
        sha: string,
        githubId: string,
    ): Promise<{ contenu: string; sha: string; titre: string }> {
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
            throw new ForbiddenException("Vous n'avez pas accès à ce diagramme");
        }

        if (!diagramme.cheminGit) {
            throw new BadRequestException(
                'Ce diagramme n\'a pas encore été sauvegardé sur GitHub',
            );
        }

        if (!diagramme.projet?.cheminGit) {
            throw new BadRequestException(
                'Ce projet n\'a pas de dépôt GitHub associé',
            );
        }

        const accessToken = await this.userService.getGithubAccessToken(githubId);
        if (!accessToken) {
            throw new BadRequestException(
                'Token GitHub non disponible, reconnectez-vous',
            );
        }

        const [owner, repo] = diagramme.projet.cheminGit.split('/');

        const contenu = await this.gitService.getFileAtCommit(
            accessToken,
            owner,
            repo,
            diagramme.cheminGit,
            sha,
        );

        return {
            contenu,
            sha,
            titre: diagramme.titre,
        };
    }

    // Charger depuis GitHub 
    async loadFromGithub(
        diagrammeId: string,
        githubId: string,
    ): Promise<{ contenu: string; titre: string; cheminGit: string }> {
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
            throw new ForbiddenException("Vous n'avez pas accès à ce diagramme");
        }


        if (!diagramme.cheminGit) {
            this.logger.warn(`Diagramme ${diagrammeId} n'a pas de cheminGit, retourne contenu vide`);
            return {
                contenu: '',
                titre: diagramme.titre,
                cheminGit: '',
            };
        }

        if (!diagramme.projet?.cheminGit) {
            throw new BadRequestException('Ce projet n\'a pas de dépôt GitHub associé');
        }


        const accessToken = await this.userService.getGithubAccessToken(githubId);
        if (!accessToken) {
            throw new BadRequestException('Token GitHub non disponible, reconnectez-vous');
        }

        const [owner, repo] = diagramme.projet.cheminGit.split('/');

        try {

            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${diagramme.cheminGit}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (!response.ok) {
                if (response.status === 404) {
                    this.logger.warn(`Fichier GitHub introuvable: ${diagramme.cheminGit}`);
                    return {
                        contenu: '',
                        titre: diagramme.titre,
                        cheminGit: diagramme.cheminGit,
                    };
                }
                throw new BadRequestException('Erreur lors du chargement depuis GitHub');
            }

            const data: any = await response.json();

            const contenu = Buffer.from(data.content, 'base64').toString('utf-8');

            return {
                contenu,
                titre: diagramme.titre,
                cheminGit: diagramme.cheminGit,
            };
        } catch (error) {
            this.logger.error(`Erreur loadFromGithub: ${error.message}`);
            throw new BadRequestException('Impossible de charger le contenu depuis GitHub');
        }
    }

    // Sauvegarder vers GitHub 
    async saveToGithub(
        diagrammeId: string,
        githubId: string,
        contenu: string,
    ): Promise<{ success: boolean; path: string; sha: string; url: string }> {
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
            throw new ForbiddenException("Vous n'avez pas le droit de sauvegarder ce diagramme");
        }

        if (!diagramme.projet?.cheminGit) {
            throw new BadRequestException('Ce projet n\'a pas de dépôt GitHub associé');
        }

        // Récupération du token depuis Redis
        const accessToken = await this.userService.getGithubAccessToken(githubId);
        if (!accessToken) {
            throw new BadRequestException('Token GitHub non disponible, reconnectez-vous');
        }

        const [owner, repo] = diagramme.projet.cheminGit.split('/');
        

        let filePath = diagramme.cheminGit;
        if (!filePath) {
            const fileName = this.gitService.slugify(diagramme.titre) || `diagram-${diagramme.id}`;
            filePath = `diagrams/${fileName}.mmd`;
        }

        try {
            // SHA (Secure Hash Algorithm) requis pour update GitHub
            const currentSha = await this.gitService.getFileSha(
                accessToken,
                owner,
                repo,
                filePath,
            );


            const result = await this.gitService.createOrUpdateFile(
                accessToken,
                owner,
                repo,
                filePath,
                contenu,
                currentSha ? `Update: ${diagramme.titre}` : `Create: ${diagramme.titre}`,
                currentSha || undefined,
            );


            await this.prisma.diagramme.update({
                where: { id: diagrammeId },
                data: { 
                    cheminGit: filePath,
                    dateModification: new Date(),
                },
            });

            this.logger.log(`Diagramme sauvegardé sur GitHub: ${diagramme.titre} -> ${filePath}`);

            return {
                success: true,
                path: filePath,
                sha: result.sha,
                url: result.url,
            };
        } catch (error) {
            this.logger.error(`Erreur saveToGithub: ${error.message}`);
            throw new BadRequestException('Impossible de sauvegarder sur GitHub');
        }
    }
}
