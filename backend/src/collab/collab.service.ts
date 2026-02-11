import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Server } from '@hocuspocus/server';
import { Redis } from '@hocuspocus/extension-redis';
import { RedisService } from '../redis/redis.service';

const INITIAL_DIAGRAM_TEMPLATE_CODE = `sequenceDiagram
    participant User
    participant System
    participant Database

    User->>System: Login Request
    System->>Database: Check Credentials
    Database-->>System: OK
    System-->>User: Auth Token

    Note right of System: Token expires in 24h`;

@Injectable()
export class CollabService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollabService.name);
  private hocuspocusServer: Server;

  constructor(private redisService: RedisService) { }

  onModuleInit() {
    this.hocuspocusServer = new Server({
      name: 'diagram-collab-server',
      port: 3032, // Port interne du container relié pour websocket

      extensions: [
        new Redis({
          // On réutilise la connexion Redis
          host: process.env.REDIS_HOST || 'redis',
          port: Number(process.env.REDIS_PORT) || 6379,
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
        console.log(`[Hocuspocus] Document chargé : ${data.documentName}`);

        // Si le document est vide, on l'initialise avec un template Mermaid de base
        const type = data.document.getText('monaco_content');
        if (type.toString() === '') {
          type.insert(0, INITIAL_DIAGRAM_TEMPLATE_CODE);
          console.log(`[Hocuspocus] Template initial injecté dans ${data.documentName}`);
        }

        return data.context;
      },
    });

    this.hocuspocusServer.listen();
    this.logger.log('Serveur Hocuspocus démarré sur le port 3032');
  }

  onModuleDestroy() {
    if (this.hocuspocusServer) {
      this.hocuspocusServer.destroy();
    }
  }
}
