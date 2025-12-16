FROM node:20-alpine

WORKDIR /app

# Installation de git pour isomorphic-git
RUN apk add --no-cache git

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 3001

# Démarrage en mode développement
CMD ["npm", "run", "start:dev"]
