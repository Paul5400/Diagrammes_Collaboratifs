FROM node:20-alpine

WORKDIR /app

# Installation des outils nécessaires
RUN apk add --no-cache git netcat-openbsd

# Copie des fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Installation des dépendances (inclut les devDependencies pour Prisma CLI)
RUN npm install --include=dev

# Copie du reste du code source
COPY . .

# Exposition du port
EXPOSE 3001

# Commande par défaut
CMD ["npm", "run", "start:dev"]
