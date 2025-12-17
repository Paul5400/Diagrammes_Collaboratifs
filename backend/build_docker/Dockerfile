FROM node:20-alpine

WORKDIR /app

# Installation des outils nécessaires
RUN apk add --no-cache git netcat-openbsd

# Copie des fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source
COPY . .

# Exposition du port
EXPOSE 3001

# Commande par défaut
CMD ["npm", "run", "start:dev"]
