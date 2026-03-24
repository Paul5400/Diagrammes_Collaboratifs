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
import { RedisService } from '../redis/redis.service';
import { Projet } from '@prisma/client';
import { CreateProjetDto } from './dto/create-projet.dto';

@Injectable()
export class ProjetService {
  private readonly logger = new Logger(ProjetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gitService: GitService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) { }

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
    const user = await this.gitService.getGithubUser(accessToken);
    const owner = user.login;

    try {
      // Vérifier si un projet PostgreSQL utilise déjà ce cheminGit
      const existingProjet = await this.prisma.projet.findFirst({
        where: { cheminGit: `${owner}/${repoName}` },
      });

      if (existingProjet) {
        throw new BadRequestException(
          `Un projet existe déjà avec ce dépôt GitHub (${owner}/${repoName}). Veuillez choisir un autre nom.`
        );
      }

      // Vérifier si le repo existe sur GitHub
      const repoInfo = await this.gitService.getRepository(accessToken, owner, repoName);

      if (repoInfo?.exists) {
        // Le repo existe déjà → REFUSER (pas d'import)
        if (repoInfo.isOwner) {
          throw new BadRequestException(
            `Un dépôt GitHub "${repoName}" existe déjà dans votre compte. Veuillez choisir un autre nom ou supprimer le dépôt existant sur GitHub.`
          );
        } else {
          throw new BadRequestException(
            `Le dépôt "${repoName}" existe déjà et appartient à ${repoInfo.currentOwner}. Veuillez choisir un autre nom.`
          );
        }
      }

      // Le repo n'existe pas → CRÉATION
      const { owner: createdOwner, repo: createdRepo, url } = await this.gitService.createRepository(
        accessToken,
        repoName,
        dto.description || '',
        dto.public !== true,
      );

      await this.gitService.createInitialReadme(
        accessToken,
        createdOwner,
        createdRepo,
        dto.titre,
      );

      // Créer le projet dans PostgreSQL
      const projet = await this.prisma.projet.create({
        data: {
          titre: dto.titre.trim(),
          description: dto.description?.trim() || null,
          cheminGit: `${createdOwner}/${createdRepo}`,
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
   * Récupérer un projet publique (sans vérification owner) avec diagrammes
   */
  async findOnePublic(id: string): Promise<any> {
    const projet = await this.prisma.projet.findUnique({
      where: { id },
      include: {
        diagrammes: {
          orderBy: { dateModification: 'desc' },
        },
      },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    // Ici on pourrait vérifier projet.public === true si on voulait restreindre
    // Mais pour l'instant l'utilisateur veut juste partager via lien
    
    return projet;
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
                username: true,
                email: true,
                avatarUrl: true,
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
      throw new NotFoundException('Utilisateur introuvable. Votre session a peut-être expiré.');
    }

    const projet = await this.prisma.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new NotFoundException('Ce projet n\'existe pas ou a déjà été supprimé.');
    }

    // Seul le propriétaire peut supprimer
    if (projet.idProprietaire !== githubUser.id) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce projet car vous n\'en êtes pas le propriétaire.');
    }

    // Supprimer le dépôt GitHub si existant
    if (projet.cheminGit) {
      this.logger.log(`Tentative de suppression du dépôt GitHub: ${projet.cheminGit}`);
      const accessToken = await this.userService.getGithubAccessToken(githubId);
      
      if (!accessToken) {
        this.logger.error(`Token GitHub non disponible pour l'utilisateur ${githubId}`);
        throw new BadRequestException(
          'Votre session GitHub a expiré. Veuillez vous déconnecter puis vous reconnecter pour supprimer ce projet.'
        );
      }

      const [owner, repo] = projet.cheminGit.split('/');
      this.logger.log(`Suppression du dépôt: ${owner}/${repo}`);
      
      // Ne pas ignorer les erreurs - si GitHub échoue, tout échoue
      await this.gitService.deleteRepository(accessToken, owner, repo);
      this.logger.log(`Dépôt GitHub supprimé avec succès: ${owner}/${repo}`);
    } else {
      this.logger.log(`Aucun dépôt GitHub associé au projet ${projet.id}`);
    }

    // Supprimer le projet en base seulement si GitHub a réussi (ou pas de dépôt)
    await this.prisma.projet.delete({
      where: { id: projetId },
    });

    this.logger.log(`Projet supprimé: ${projet.id}`);
  }

  /**
   * Sauvegarder tous les diagrammes d'un projet vers GitHub
   */
  async saveDiagramsToGithub(
    projetId: string,
    githubId: string,
  ): Promise<{
    success: boolean;
    savedDiagrams: Array<{
      id: string;
      titre: string;
      path: string;
      sha: string;
      url: string;
    }>;
    errors: Array<{ id: string; titre: string; error: string }>;
  }> {
    const githubUser = await this.userService.findByGithubId(githubId);
    if (!githubUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const projet = await this.prisma.projet.findUnique({
      where: { id: projetId },
      include: {
        diagrammes: true,
        collaborations: true,
      },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    // Vérifier si l'utilisateur est propriétaire OU collaborateur avec droit d'écriture
    const isOwner = projet.idProprietaire === githubUser.id;
    const hasWriteAccess = projet.collaborations.some(
      (collab) =>
        collab.idUtilisateur === githubUser.id &&
        collab.droit === 'ecriture'
    );

    if (!isOwner && !hasWriteAccess) {
      throw new ForbiddenException(
        'Vous devez être propriétaire ou collaborateur avec droit d\'écriture pour sauvegarder ce projet'
      );
    }

    if (!projet.cheminGit) {
      throw new BadRequestException('Ce projet n\'a pas de dépôt GitHub associé');
    }

    const accessToken = await this.userService.getGithubAccessToken(githubId);
    if (!accessToken) {
      throw new BadRequestException('Token GitHub non disponible, reconnectez-vous');
    }

    const [owner, repo] = projet.cheminGit.split('/');
    const savedDiagrams: Array<{
      id: string;
      titre: string;
      path: string;
      sha: string;
      url: string;
    }> = [];
    const errors: Array<{ id: string; titre: string; error: string }> = [];

    for (const diagramme of projet.diagrammes) {
      try {
        let filePath = diagramme.cheminGit;
        if (!filePath) {
          const baseSlug = this.gitService.slugify(diagramme.titre) || 'diagram';
          const shortId = diagramme.id.substring(0, 6);
          const fileName = `${baseSlug}-${shortId}`;
          filePath = `diagrams/${fileName}.mmd`;
        }

        const redisKey = `yjs:diagram-${diagramme.id}`;
        const redisContent = await this.redisService.get(redisKey);

        const finalContent = redisContent ?? diagramme.contenu ?? '';


        // Récupérer le SHA actuel du fichier s'il existe
        const currentSha = await this.gitService.getFileSha(
          accessToken,
          owner,
          repo,
          filePath,
        );

        // Créer ou mettre à jour le fichier
        const result = await this.gitService.createOrUpdateFile(
          accessToken,
          owner,
          repo,
          filePath,
          finalContent,
          `Update: ${diagramme.titre}`,
          currentSha || undefined,
        );

        // Mettre à jour le cheminGit dans la base de données
        if (diagramme.cheminGit !== filePath) {
           await this.prisma.diagramme.update({
             where: { id: diagramme.id },
             data: { cheminGit: filePath },
           });
        }

        savedDiagrams.push({
          id: diagramme.id,
          titre: diagramme.titre,
          path: filePath,
          sha: result.sha,
          url: result.url,
        });

        this.logger.log(`Diagramme sauvegardé: ${diagramme.titre} -> ${filePath}`);
      } catch (error) {
        this.logger.error(
          `Erreur lors de la sauvegarde du diagramme ${diagramme.id}: ${error.message}`,
        );
        errors.push({
          id: diagramme.id,
          titre: diagramme.titre,
          error: error.message,
        });
      }
    }

    // Mettre à jour la date de modification du projet
    await this.prisma.projet.update({
      where: { id: projetId },
      data: { dateModification: new Date() },
    });

    return {
      success: errors.length === 0,
      savedDiagrams,
      errors,
    };
  }

  /**
   * Supprimer un collaborateur d'un projet.
   * Seul le propriétaire du projet peut effectuer cette action.
   */
  async removeCollaborator(ownerGithubId: string, projectId: string, collaboratorId: string) {
    const owner = await this.userService.findByGithubId(ownerGithubId);
    if (!owner) throw new NotFoundException('Utilisateur introuvable');

    const projet = await this.prisma.projet.findUnique({ where: { id: projectId } });
    if (!projet) throw new NotFoundException('Projet introuvable');

    if (projet.idProprietaire !== owner.id) {
      throw new ForbiddenException("Vous n'êtes pas le propriétaire de ce projet");
    }

    await this.prisma.collaboration.deleteMany({
      where: {
        idUtilisateur: collaboratorId,
        idProjet: projectId,
      },
    });

    return { message: 'Collaborateur supprimé avec succès' };
  }
}
