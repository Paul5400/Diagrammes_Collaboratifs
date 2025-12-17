import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Service Prisma pour gérer la connexion à la base de données
 * Implémente les hooks de lifecycle NestJS pour la gestion de la connexion
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  /**
   * Connexion à la base de données au démarrage du module
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connexion PostgreSQL établie via Prisma');
  }

  /**
   * Déconnexion propre lors de l'arrêt de l'application
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Déconnexion PostgreSQL via Prisma');
  }
}
