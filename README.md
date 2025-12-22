# Diagrammes Collaboratifs

Projet de création de diagrammes en temps réel.

## Membres de l'équipe
- Mirac DEMIRCI
- Guillaume HESS
- Julien NOEL
- Julien DEFOLIE
- Paul ANDRIEU

## Lancement rapide

1.  **Configuration** : Copiez `.env.dist` en `.env` et remplissez vos identifiants GitHub OAuth.
    ```bash
    cp .env.dist .env
    ```
2.  **Démarrage** : Lancez Docker Compose.
    ```bash
    docker-compose up --build
    ```

*Note : La base de données est automatiquement initialisée au démarrage du conteneur backend grâce à Prisma.*

## Ports par défaut
- **Frontend** : [http://localhost:3003](http://localhost:3003)
- **Backend** : [http://localhost:3002](http://localhost:3002)
- **Adminer (DB)** : [http://localhost:8080](http://localhost:8080)
