# Configuration de Production (DockEtu)

Ce document liste les variables d'environnement nécessaires pour faire tourner l'application en production.

##  Secrets GitHub (GitHub Actions)

Dans les paramètres de votre dépôt GitHub (**Settings > Secrets and variables > Actions**), assurez-vous que les secrets suivants sont configurés :
- `GITHUB_TOKEN` : (Géré automatiquement par GitHub, pas besoin de l'ajouter manuellement).

##  Variables d'Environnement DockEtu

Sur le serveur DockEtu, vous devrez définir les variables suivantes dans votre environnement ou un fichier `.env` :

### Base de données (Postgres)
- `DB_USER` : Nom d'utilisateur Postgres (ex: `postgres`).
- `DB_PASSWORD` : Mot de passe Postgres.
- `DB_NAME` : Nom de la base de données (ex: `diagrammer`).

### Backend (NestJS)
- `DATABASE_URL` : `postgresql://${DB_USER}:${DB_PASSWORD}@diagrammer.db:5432/${DB_NAME}?schema=public`
- `NODE_ENV` : `production`
- `JWT_SECRET` : Une clé secrète longue et complexe.
- `GITHUB_CLIENT_ID` : ID de votre application GitHub OAuth de production.
- `GITHUB_CLIENT_SECRET` : Secret de votre application GitHub OAuth de production.
- `GITHUB_CALLBACK_URL` : `https://votre-url-backend.docketu.ovh/auth/github/callback`

### Frontend (Next.js)
- `NEXT_PUBLIC_BACKEND_URL` : URL publique de votre API (ex: `https://votre-url-backend.docketu.ovh`).
- `NEXT_PUBLIC_WS_URL` : URL publique du WebSocket (ex: `wss://votre-url-backend.docketu.ovh`).

##  Commande de déploiement

Pour mettre à jour sur DockEtu :
```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
