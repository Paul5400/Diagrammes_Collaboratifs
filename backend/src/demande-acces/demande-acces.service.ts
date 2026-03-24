import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { GitService } from '../git/git.service';
import { CreateDemandeAccesDto } from './dto/create-demande-acces.dto';
import { Droit, StatutDemande } from '@prisma/client';

@Injectable()
export class DemandeAccesService {
  private readonly logger = new Logger(DemandeAccesService.name);

  constructor(
      private readonly prisma: PrismaService,
      private readonly userService: UserService,
      private readonly gitService: GitService,
      private readonly jwtService: JwtService,
  ) {}

  /**
   * Helper pour récupérer l'utilisateur interne depuis le GitHub ID
   */
  private async getInternalUser(githubId: string) {
    const user = await this.userService.findByGithubId(githubId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  /**
   * Vérifie et accepte automatiquement les invitations GitHub en attente.
   * (Stub — à implémenter si nécessaire)
   */
  async verifierEtAccepterInvitationsGitHub(githubId: string) {
    this.logger.log(`Vérification des invitations GitHub pour ${githubId} (non implémenté)`);
    return { message: 'Aucune invitation à traiter' };
  }

  async create(githubId: string, dto: CreateDemandeAccesDto) {
    const user = await this.getInternalUser(githubId);
    const userId = user.id;
    const { projetId } = dto;

    // 1. Vérifier si le projet existe
    const projet = await this.prisma.projet.findUnique({
      where: { id: projetId },
      include: { proprietaire: true },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    // 2. Vérifier si l'utilisateur n'a pas déjà accès (propriétaire ou collaborateur)
    if (projet.idProprietaire === userId) {
      throw new ConflictException(
        'Vous êtes déjà le propriétaire de ce projet',
      );
    }

    const collaboration = await this.prisma.collaboration.findUnique({
      where: {
        unique_utilisateur_projet: {
          idUtilisateur: userId,
          idProjet: projetId,
        },
      },
    });

    if (collaboration) {
      throw new ConflictException('Vous êtes déjà collaborateur sur ce projet');
    }

    // 3. Vérifier s'il n'y a pas déjà une demande en attente
    const demandeExistante = await this.prisma.demandeAcces.findUnique({
      where: {
        idUtilisateur_idProjet: {
          idUtilisateur: userId,
          idProjet: projetId,
        },
      },
    });

    if (demandeExistante) {
      if (demandeExistante.statut === 'en_attente') {
        throw new ConflictException(
          'Une demande est déjà en cours pour ce projet',
        );
      } else if (demandeExistante.statut === 'acceptee') {
        throw new ConflictException('Vous avez déjà accès à ce projet');
      }
      // Si refusée, on peut éventuellement permettre de redemander,
      // ou on met à jour la demande existante.
      // Pour l'instant on met à jour le statut en 'en_attente'
      return this.prisma.demandeAcces.update({
        where: { id: demandeExistante.id },
        data: {
          statut: 'en_attente',
          dateDemande: new Date(), // Reset date
        },
      });
    }

    // 4. Créer la demande
    const demande = await this.prisma.demandeAcces.create({
      data: {
        idUtilisateur: userId,
        idProjet: projetId,
        statut: 'en_attente',
      },
    });

    // 5. Créer une notification pour le propriétaire
    // Le "user" récupéré au début de la fonction contient déjà les infos
    // (Note: user est de type GithubUser, donc contient username/email)
    const demandeurName = user.username || user.email || 'Un utilisateur';

    await this.prisma.notification.create({
      data: {
        idUtilisateur: projet.idProprietaire,
        type: 'demande_acces',
        message: `${demandeurName} souhaite accéder au projet "${projet.titre}"`,
        data: JSON.stringify({
          projetId: projet.id,
          projetTitre: projet.titre,
          demandeurId: userId,
          demandeId: demande.id,
        }),
      },
    });

    return demande;
  }

  async findAllByOwner(githubId: string) {
    const user = await this.getInternalUser(githubId);

    return this.prisma.demandeAcces.findMany({
      where: {
        projet: {
          idProprietaire: user.id,
        },
        statut: 'en_attente',
      },
      include: {
        projet: {
          select: { id: true, titre: true },
        },
        utilisateur: {
          select: { id: true, username: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { dateDemande: 'desc' },
    });
  }

  async accepterDemande(demandeId: string, githubId: string) {
    const user = await this.getInternalUser(githubId);

    // 1. Trouver la demande et le projet associé
    const demande = await this.prisma.demandeAcces.findUnique({
      where: { id: demandeId },
      include: { projet: true },
    });

    if (!demande) {
      throw new NotFoundException('Demande introuvable');
    }

    // 2. Vérifier que c'est bien le propriétaire du projet qui accepte
    if (demande.projet.idProprietaire !== user.id) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce projet",
      );
    }

    // 3. Mettre à jour le statut
    const demandeUpdated = await this.prisma.demandeAcces.update({
      where: { id: demandeId },
      data: { statut: StatutDemande.acceptee },
    });

    // 4. Ajouter la collaboration
    await this.prisma.collaboration.create({
      data: {
        idProjet: demande.idProjet,
        idUtilisateur: demande.idUtilisateur,
        droit: Droit.lecture, // Droit par défaut
      },
    });

    // 5. Notifier le demandeur
    await this.prisma.notification.create({
      data: {
        idUtilisateur: demande.idUtilisateur,
        type: 'acces_accepte',
        message: `Votre demande d'accès au projet "${demande.projet.titre}" a été acceptée.`,
        data: JSON.stringify({ projetId: demande.idProjet }),
      },
    });

    // 6. Ajouter le collaborateur au dépôt GitHub si le projet en a un
    if (demande.projet.cheminGit) {
      const [repoOwner, repoName] = demande.projet.cheminGit.split('/');

      // Token du propriétaire (c'est lui qui envoie l'invitation)
      const proprietaireToken = await this.userService.getGithubAccessToken(user.githubId);

      // Infos du collaborateur (le demandeur)
      const collaborateur = await this.prisma.githubUser.findUnique({
        where: { id: demande.idUtilisateur },
      });

      if (proprietaireToken && collaborateur?.username) {
        try {
          const invitationId = await this.gitService.inviterCollaborateur(
            proprietaireToken,
            repoOwner,
            repoName,
            collaborateur.username,
          );

          // Accepter automatiquement si on dispose du token du collaborateur
          if (invitationId !== null) {
            const collaborateurToken = await this.userService.getGithubAccessToken(collaborateur.githubId);
            if (collaborateurToken) {
              await this.gitService.accepterInvitation(collaborateurToken, invitationId);
              this.logger.log(
                `${collaborateur.username} ajouté automatiquement au dépôt ${demande.projet.cheminGit}`,
              );
            } else {
              this.logger.warn(
                `Token manquant pour ${collaborateur.username} - l'invitation GitHub reste en attente`,
              );
            }
          }
        } catch (e) {
          // On ne bloque pas l'acceptation si l'ajout GitHub échoue
          this.logger.warn(
            `Impossible d'ajouter ${collaborateur.username} au dépôt GitHub: ${e.message}`,
          );
        }
      } else {
        this.logger.warn(
          `Ajout GitHub ignoré: token propriétaire=${!!proprietaireToken}, username collaborateur=${collaborateur?.username ?? 'inconnu'}`,
        );
      }
    }

    return demandeUpdated;
  }

  /**
   * Génère un token JWT signé valable 7 jours permettant à n'importe quel
   * utilisateur connecté d'envoyer une demande d'accès sur ce projet.
   * Seul le propriétaire ou un collaborateur peut générer ce token.
   */
  async generateInviteToken(
    githubId: string,
    projetId: string,
  ): Promise<{ token: string }> {
    const user = await this.getInternalUser(githubId);

    const projet = await this.prisma.projet.findUnique({ where: { id: projetId } });
    if (!projet) throw new NotFoundException('Projet introuvable');

    const isOwner = projet.idProprietaire === user.id;
    if (!isOwner) {
      const collab = await this.prisma.collaboration.findUnique({
        where: {
          unique_utilisateur_projet: { idUtilisateur: user.id, idProjet: projetId },
        },
      });
      if (!collab) throw new ForbiddenException("Vous n'avez pas accès à ce projet");
    }

    const token = this.jwtService.sign(
      { projetId, type: 'direct-invite', ownerGithubId: githubId },
      { expiresIn: '7d' },
    );

    this.logger.log(`Token d'invitation directe généré pour le projet ${projetId} par ${githubId}`);
    return { token };
  }

  /**
   * Rejoindre directement un projet via un lien d'invitation signé.
   * Ajoute l'utilisateur en tant que collaborateur (BDD + GitHub) sans approbation manuelle.
   */
  async rejoindreSurInvitation(githubId: string, inviteToken: string): Promise<{ projetId: string; titre: string }> {
    // 1. Vérifier la signature JWT
    let payload: { projetId: string; type: string; ownerGithubId: string };
    try {
      payload = this.jwtService.verify(inviteToken);
    } catch {
      throw new ForbiddenException("Lien d'invitation invalide ou expiré");
    }

    if (payload.type !== 'direct-invite') {
      throw new ForbiddenException("Type de token invalide");
    }

    const { projetId, ownerGithubId } = payload;

    // 2. Récupérer l'utilisateur qui rejoint
    const user = await this.getInternalUser(githubId);

    // 3. Récupérer le projet
    const projet = await this.prisma.projet.findUnique({ where: { id: projetId } });
    if (!projet) throw new NotFoundException('Projet introuvable');

    // 4. Vérifier qu'il n'est pas déjà membre
    if (projet.idProprietaire === user.id) {
      return { projetId, titre: projet.titre }; // Déjà propriétaire, rediriger quand même
    }

    const existingCollab = await this.prisma.collaboration.findUnique({
      where: { unique_utilisateur_projet: { idUtilisateur: user.id, idProjet: projetId } },
    });
    if (existingCollab) {
      return { projetId, titre: projet.titre }; // Déjà collaborateur, rediriger quand même
    }

    // 5. Créer la collaboration en BDD
    await this.prisma.collaboration.create({
      data: {
        idUtilisateur: user.id,
        idProjet: projetId,
        droit: Droit.ecriture,
      },
    });

    // 6. Ajouter au dépôt GitHub
    if (projet.cheminGit && user.username) {
      const [repoOwner, repoName] = projet.cheminGit.split('/');
      const ownerToken = await this.userService.getGithubAccessToken(ownerGithubId);
      if (ownerToken) {
        try {
          const invitationId = await this.gitService.inviterCollaborateur(
            ownerToken, repoOwner, repoName, user.username,
          );
          if (invitationId !== null) {
            const userToken = await this.userService.getGithubAccessToken(githubId);
            if (userToken) {
              await this.gitService.accepterInvitation(userToken, invitationId);
              this.logger.log(`${user.username} ajouté directement au dépôt ${projet.cheminGit}`);
            }
          }
        } catch (e) {
          this.logger.warn(`Ajout GitHub échoué (non bloquant) : ${e.message}`);
        }
      }
    }

    // 7. Notifier le propriétaire
    const owner = await this.getInternalUser(ownerGithubId);
    const joinerName = user.username || user.email || 'Un utilisateur';
    await this.prisma.notification.create({
      data: {
        idUtilisateur: owner.id,
        type: 'acces_accepte',
        message: `${joinerName} a rejoint votre projet "${projet.titre}" via un lien d'invitation.`,
        data: JSON.stringify({ projetId }),
      },
    });

    this.logger.log(`${githubId} a rejoint le projet ${projetId} via invitation directe`);
    return { projetId, titre: projet.titre };
  }

  async refuserDemande(demandeId: string, githubId: string) {
    const user = await this.getInternalUser(githubId);

    // 1. Trouver la demande
    const demande = await this.prisma.demandeAcces.findUnique({
      where: { id: demandeId },
      include: { projet: true },
    });

    if (!demande) {
      throw new NotFoundException('Demande introuvable');
    }

    // 2. Vérifier owner
    if (demande.projet.idProprietaire !== user.id) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce projet",
      );
    }

    // 3. Update statut
    const demandeUpdated = await this.prisma.demandeAcces.update({
      where: { id: demandeId },
      data: { statut: StatutDemande.refusee },
    });

    // 4. Notifier
    await this.prisma.notification.create({
      data: {
        idUtilisateur: demande.idUtilisateur,
        type: 'acces_refuse',
        message: `Votre demande d'accès au projet "${demande.projet.titre}" a été refusée.`,
        data: JSON.stringify({ projetId: demande.idProjet }),
      },
    });

    return demandeUpdated;
  }
}
