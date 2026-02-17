import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Server } from '@hocuspocus/server';
import { Redis } from '@hocuspocus/extension-redis';
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

      // Timeout 100ms pour éviter race conditions Redis
      onLoadDocument: async (data) => {
        console.log(`[Hocuspocus] Chargement de ${data.documentName}`);

        const prisma = this.prisma;
        const userService = this.userService;

        // Timeout 100ms pour laisser Redis charger asynchroniquement
        return new Promise((resolve) => {
          setTimeout(async () => {
            const type = data.document.getText('monaco_content');
            const currentContent = type.toString();

            console.log(`[Hocuspocus] Contenu actuel : "${currentContent.substring(0, 50)}..." (${currentContent.length} chars)`);

            // Si déjà en Redis, ne rien faire
            if (currentContent.trim() === '') {
              const diagramId = data.documentName.replace('diagram-', '');
              console.log(`[Hocuspocus] Document vide, tentative de chargement pour ${diagramId}`);

              if (diagramId && diagramId.length === 36) { // Format UUID
                try {
                  const diagramme = await prisma.diagramme.findUnique({
                    where: { id: diagramId },
                    include: { 
                      projet: { 
                        include: { 
                          proprietaire: true 
                        } 
                      } 
                    },
                  });

                  if (!diagramme) {
                    console.log(`[Hocuspocus] Diagramme ${diagramId} introuvable en DB`);
                    resolve(data.context);
                    return;
                  }

                  if (diagramme.cheminGit && diagramme.projet?.cheminGit) {
                    try {
                      const githubId = diagramme.projet.proprietaire.githubId;
                      const accessToken = await userService.getGithubAccessToken(githubId);

                      if (accessToken) {
                        const [owner, repo] = diagramme.projet.cheminGit.split('/');
                        
                        const response = await fetch(
                          `https://api.github.com/repos/${owner}/${repo}/contents/${diagramme.cheminGit}`,
                          {
                            headers: {
                              Authorization: `Bearer ${accessToken}`,
                              'Content-Type': 'application/json',
                            },
                          },
                        );

                        if (response.ok) {
                          const fileData: any = await response.json();
                          const githubContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
                          
                          console.log(`[Hocuspocus] Contenu chargé depuis GitHub (${githubContent.length} chars)`);
                          type.insert(0, githubContent);
                          resolve(data.context);
                          return;
                        } else {
                          console.log(`[Hocuspocus] Fichier GitHub non trouvé (${response.status}), fallback...`);
                        }
                      } else {
                        console.log(`[Hocuspocus] Token GitHub non disponible, fallback...`);
                      }
                    } catch (error) {
                      console.warn(`[Hocuspocus] Erreur chargement GitHub: ${error.message}, fallback...`);
                    }
                  }

                  if (diagramme.contenu) {
                    console.log(`[Hocuspocus] Contenu chargé depuis PostgreSQL legacy (${diagramme.contenu.length} chars)`);
                    type.insert(0, diagramme.contenu);
                  } else {
                    console.log(`[Hocuspocus] Aucun contenu trouvé pour ${diagramId} (nouveau diagramme)`);
                  }
                } catch (error) {
                  console.error(`[Hocuspocus] Erreur lors du chargement: ${error.message}`);
                }
              }
            } else {
              console.log(`[Hocuspocus] Document existant chargé depuis Redis (${currentContent.length} chars)`);
            }

            resolve(data.context);
          }, 100);
        });
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
