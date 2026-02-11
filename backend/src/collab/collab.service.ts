import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Server } from '@hocuspocus/server';
import { Redis } from '@hocuspocus/extension-redis';
import { RedisService } from '../redis/redis.service';

// Template Mermaid injecté uniquement pour les nouveaux diagrammes (pas de contenu dans Redis)
const INITIAL_DIAGRAM_TEMPLATE_CODE = `sequenceDiagram
    participant User
    participant System
    participant Database

    User->>System: Login Request
    System->>Database: Check Credentials
    Database-->>System: OK
    System-->>User: Auth Token

    Note right of System: Token expires in 24h`;

/**
 * Service de collaboration WebSocket avec Yjs/Hocuspocus
 * Synchronise les documents entre clients et persiste dans Redis
 */
@Injectable()
export class CollabService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollabService.name);
  private hocuspocusServer: Server;

  constructor(private redisService: RedisService) { }

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
      async onLoadDocument(data) {
        console.log(`[Hocuspocus] Chargement de ${data.documentName}`);

        // CRITIQUE : Timeout de 100ms pour laisser Redis charger le contenu de manière asynchrone
        // Sans délai, le document peut paraître vide même s'il existe dans Redis → template injecté par erreur
        return new Promise((resolve) => {
          setTimeout(() => {
            const type = data.document.getText('monaco_content');
            const currentContent = type.toString();
            
            console.log(`[Hocuspocus] Contenu actuel : "${currentContent.substring(0, 50)}..." (${currentContent.length} chars)`);
            
            if (currentContent.trim() === '') {
              type.insert(0, INITIAL_DIAGRAM_TEMPLATE_CODE);
              console.log(`[Hocuspocus] Template injecté`);
            } else {
              console.log(`[Hocuspocus] Document existant chargé`);
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
