import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitService } from '../git/git.service';
import { UserService } from '../user/user.service';
import { Projet } from '@prisma/client';
import { CreateProjetDto } from './dto/create-projet.dto';

@Injectable()
export class ProjetService {
  private readonly logger = new Logger(ProjetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
    private readonly userService: UserService,
  ) {}

  /**
   * Créer un nouveau projet avec un dépôt GitHub
   */
  async create(githubId: string, dto: CreateProjetDto): Promise<Projet> {
    if (!dto.titre || dto.titre.trim().length === 0) {
      throw new BadRequestException('Le titre est obligatoire');
    }

    const githubUser = await this.userService.findByGithubId(githubId);
    if (!githubUser) {
      throw new NotFoundException('Utilisateur GitHub introuvable');
    }

    const accessToken = await this.userService.getGithubAccessToken(githubId);
    if (!accessToken) {
      throw new BadRequestException('Token GitHub non disponible, reconnectez-vous');
    }

    const repoName = this.gitService.slugify(dto.titre);
    
    try {
      const { owner, repo, url } = await this.gitService.createRepository(
        accessToken,
        repoName,
        dto.description || '',
        dto.public !== true,
      );

      await this.gitService.createInitialReadme(
        accessToken,
        owner,
        repo,
        dto.titre,
      );

      const projet = await this.prisma.projet.create({
        data: {
          titre: dto.titre.trim(),
          description: dto.description?.trim() || null,
          cheminGit: `${owner}/${repo}`,
          public: dto.public || false,
          idProprietaire: githubUser.id,
        },
      });

      this.logger.log(`Projet créé: ${projet.titre} (${projet.cheminGit})`);

      return projet;
    } catch (error) {
      this.logger.error(`Erreur lors de la création du projet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupérer tous les projets d'un utilisateur
   */
  async findAllByUser(githubId: string): Promise<Projet[]> {
    const githubUser = await this.userService.findByGithubId(githubId);
    if (!githubUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const projets = await this.prisma.projet.findMany({
      where: { idProprietaire: githubUser.id },
      orderBy: { dateModification: 'desc' },
      include: {
        _count: {
          select: { diagrammes: true },
        },
      },
    });

    return projets;
  }

  /**
   * Récupérer un projet spécifique
   */
  async findOne(projetId: string, githubId: string): Promise<Projet> {
    const githubUser = await this.userService.findByGithubId(githubId);
    if (!githubUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const projet = await this.prisma.projet.findUnique({
      where: { id: projetId },
      include: {
        diagrammes: true,
        collaborations: {
          include: {
            utilisateur: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    const isOwner = projet.idProprietaire === githubUser.id;
    const hasCollaboration = projet.collaborations.some(
      (c) => c.idUtilisateur === githubUser.id,
    );

    if (!projet.public && !isOwner && !hasCollaboration) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce projet');
    }

    return projet;
  }

  /**
   * Supprimer un projet et son dépôt GitHub
   */
  async delete(projetId: string, githubId: string): Promise<void> {
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

    // Seul le propriétaire peut supprimer
    if (projet.idProprietaire !== githubUser.id) {
      throw new ForbiddenException('Seul le propriétaire peut supprimer ce projet');
    }

    // Supprimer le dépôt GitHub si existant
    if (projet.cheminGit) {
      const accessToken = await this.userService.getGithubAccessToken(githubId);
      if (accessToken) {
        const [owner, repo] = projet.cheminGit.split('/');
        try {
          await this.gitService.deleteRepository(accessToken, owner, repo);
        } catch (error) {
          this.logger.warn(`Impossible de supprimer le dépôt GitHub: ${error.message}`);
        }
      }
    }

    await this.prisma.projet.delete({
      where: { id: projetId },
    });

    this.logger.log(`Projet supprimé: ${projet.id}`);
  }
}
