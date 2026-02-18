import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Server } from '@hocuspocus/server';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import * as Y from 'yjs';

@Injectable()
export class CollabService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollabService.name);
  private hocuspocusServer: Server;

  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
    private userService: UserService,
  ) { }

  // Lifecycle NestJS : Démarrer le serveur WebSocket après l'initialisation des modules
  onModuleInit() {
    this.hocuspocusServer = new Server({
      name: 'diagram-collab-server',
      port: 3032, // Port interne du container relié pour websocket

      onConnect() {
        return new Promise((resolve) => {
          console.log('[Hocuspocus] Nouveau client connecté');
          resolve(null);
        });
      },
      
      onDisconnect() {
        console.log('[Hocuspocus] Client déconnecté');
        return Promise.resolve();
      },

      // Charger le document depuis Redis ou GitHub
      onLoadDocument: async (data) => {
        console.log(`[Hocuspocus] Chargement de ${data.documentName}`);

        const redisService = this.redisService;
        const prisma = this.prisma;
        const userService = this.userService;

        // Essayer de charger depuis Redis d'abord
        const redisKey = `yjs:${data.documentName}`;
        const redisContent = await redisService.get(redisKey);

        if (redisContent) {
          console.log(`[Hocuspocus] Chargé depuis Redis (${redisContent.length} chars)`);
          const type = data.document.getText('monaco_content');
          type.insert(0, redisContent);
          return;
        }

        // Redis vide, charger depuis GitHub/DB
        console.log(`[Hocuspocus] Redis vide, chargement depuis GitHub/DB`);
        const diagramId = data.documentName.replace('diagram-', '');

        if (diagramId && diagramId.length === 36) {
          try {
            const diagramme = await prisma.diagramme.findUnique({
              where: { id: diagramId },
              include: { projet: { include: { proprietaire: true } } },
            });

            if (!diagramme) {
              console.log(`[Hocuspocus] Diagramme introuvable`);
              return;
            }

            let loadedContent = '';

            // Charger depuis GitHub si disponible
            if (diagramme.cheminGit && diagramme.projet?.cheminGit) {
              try {
                const githubId = diagramme.projet.proprietaire.githubId;
                const accessToken = await userService.getGithubAccessToken(githubId);

                if (accessToken) {
                  const [owner, repo] = diagramme.projet.cheminGit.split('/');
                  const response = await fetch(
                    `https://api.github.com/repos/${owner}/${repo}/contents/${diagramme.cheminGit}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } },
                  );

                  if (response.ok) {
                    const fileData: any = await response.json();
                    loadedContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
                    console.log(`[Hocuspocus] Chargé depuis GitHub (${loadedContent.length} chars)`);
                  }
                }
              } catch (error) {
                console.warn(`[Hocuspocus] Erreur GitHub: ${error.message}`);
              }
            }

            // Fallback PostgreSQL
            if (!loadedContent && diagramme.contenu) {
              loadedContent = diagramme.contenu;
              console.log(`[Hocuspocus] Chargé depuis PostgreSQL (${loadedContent.length} chars)`);
            }

            // Insérer dans Yjs et sauvegarder dans Redis
            if (loadedContent) {
              const type = data.document.getText('monaco_content');
              type.insert(0, loadedContent);
              await redisService.set(redisKey, loadedContent);
              console.log(`[Hocuspocus] Contenu sauvegardé dans Redis`);
            }
          } catch (error) {
            console.error(`[Hocuspocus] Erreur: ${error.message}`);
          }
        }
      },

      // Sauvegarder le document dans Redis à chaque modification
      onStoreDocument: async (data) => {
        const redisKey = `yjs:${data.documentName}`;
        const type = data.document.getText('monaco_content');
        const content = type.toString();

        if (content.trim()) {
          await this.redisService.set(redisKey, content);
          console.log(`[Hocuspocus] Sauvegardé dans Redis: ${data.documentName} (${content.length} chars)`);
        }
      },
    });

    this.hocuspocusServer.listen();
    this.logger.log('Serveur Hocuspocus démarré sur le port 3032');
  }

  // Fermer proprement les connexions WebSocket avant l'arrêt
  onModuleDestroy() {
    if (this.hocuspocusServer) {
      this.hocuspocusServer.destroy();
    }
  }
}
