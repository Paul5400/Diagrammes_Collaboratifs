import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { CreateDemandeAccesDto } from './dto/create-demande-acces.dto';
import { Droit, StatutDemande } from '@prisma/client';

@Injectable()
export class DemandeAccesService {
  constructor(
      private readonly prisma: PrismaService,
      private readonly userService: UserService,
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

  async create(githubId: string, dto: CreateDemandeAccesDto) {
    const user = await this.getInternalUser(githubId);
    const userId = user.id; // UUID interne
    const { projetId } = dto;
    // ... existing method create ...

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
    
    // Récupérer les demandes pour les projets dont je suis propriétaire
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

    return demandeUpdated;
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
