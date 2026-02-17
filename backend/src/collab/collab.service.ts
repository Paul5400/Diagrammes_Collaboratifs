import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Server } from '@hocuspocus/server';
import { Redis } from '@hocuspocus/extension-redis';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

// Les templates sont maintenant gérés côté Frontend ou chargés depuis la DB
// pour correspondre au type de diagramme choisi par l'utilisateur.

/**
 * Service de collaboration WebSocket avec Yjs/Hocuspocus
 * Synchronise les documents entre clients et persiste dans Redis
 */
@Injectable()
export class CollabService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollabService.name);
  private hocuspocusServer: Server;

  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
  ) { }

  // Lifecycle NestJS : Démarrer le serveur WebSocket après l'initialisation des modules
  onModuleInit() {
    this.hocuspocusServer = new Server({
      name: 'diagram-collab-server',
      port: 3032, // Port interne du container relié pour websocket

      // Extension Redis : Persiste les documents Yjs (sinon perdus au redémarrage)
      extensions: [
        new Redis({
          // On réutilise la connexion Redis
          host: process.env.REDIS_HOST || 'redis',
          port: Number(process.env.REDIS_PORT) || 6379,
          prefix: 'hocuspocus:',
        }),
      ],

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
      onLoadDocument: async (data) => {
        console.log(`[Hocuspocus] Chargement de ${data.documentName}`);

        const prisma = this.prisma;

        // CRITIQUE : Timeout de 100ms pour laisser Redis charger le contenu de manière asynchrone
        // Sans délai, le document peut paraître vide même s'il existe dans Redis → template injecté par erreur
        return new Promise((resolve) => {
          setTimeout(async () => {
            const type = data.document.getText('monaco_content');
            const currentContent = type.toString();

            console.log(`[Hocuspocus] Contenu actuel : "${currentContent.substring(0, 50)}..." (${currentContent.length} chars)`);

            if (currentContent.trim() === '') {
              const diagramId = data.documentName.replace('diagram-', '');
              console.log(`[Hocuspocus] Document vide, tentative de restauration Prisma pour ${diagramId}`);

              if (diagramId && diagramId.length === 36) { // Format UUID
                try {
                  const diagramme = await prisma.diagramme.findUnique({
                    where: { id: diagramId },
                    select: { contenu: true }
                  });

                  if (diagramme?.contenu) {
                    console.log(`[Hocuspocus] Contenu trouvé en DB (${diagramme.contenu.length} chars). Insertion...`);
                    type.insert(0, diagramme.contenu);
                    console.log(`[Hocuspocus] Contenu restauré depuis Prisma pour ${diagramId}`);
                  } else {
                    console.log(`[Hocuspocus] Aucun contenu trouvé en DB pour ${diagramId}`);
                  }
                } catch (error) {
                  console.error(`[Hocuspocus] Erreur lors de la récupération Prisma: ${error.message}`);
                }
              }
            } else {
              console.log(`[Hocuspocus] Document existant chargé depuis Redis (${currentContent.length} chars)`);
            }

            resolve(data.context);
          }, 100);
        });
      },

      onStoreDocument: async (data) => {
        const prisma = this.prisma;
        const diagramId = data.documentName.replace('diagram-', '');

        if (diagramId && diagramId.length === 36) {
          const content = data.document.getText('monaco_content').toString();

          try {
            await prisma.diagramme.update({
              where: { id: diagramId },
              data: { contenu: content }
            });
            console.log(`[Hocuspocus] Document ${diagramId} persisté dans Prisma (${content.length} chars)`);
          } catch (error) {
            console.error(`[Hocuspocus] Erreur persistence Prisma: ${error.message}`);
          }
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
